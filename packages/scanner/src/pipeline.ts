import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { VisibilityScanPipelineOptions, VisibilityScanPipelineResult, BusinessContextFieldRecord } from './types';
import { getProvider } from './registry';
import { generatePromptsFromContext, syncPromptLibrary } from './prompts/generator';

type ValidEntityType = 'organization' | 'person' | 'brand' | 'location' | 'other';

function mapSentiment(sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed' | string | null): 'positive' | 'neutral' | 'negative' | null {
  if (!sentiment) return null;
  if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') return sentiment;
  return 'neutral';
}

function validateEntityType(rawType?: string | null): ValidEntityType {
  const normalized = rawType?.toLowerCase().trim();
  return normalized && ['organization', 'person', 'brand', 'location', 'other'].includes(normalized)
    ? (normalized as ValidEntityType)
    : 'other';
}

export async function runVisibilityScanPipeline(supabase: SupabaseClient<Database>, options: VisibilityScanPipelineOptions): Promise<VisibilityScanPipelineResult> {
  const { projectId, jobId } = options;
  const setJobStatus = async (status: 'running' | 'completed' | 'failed', errorMessage?: string) => {
    if (!jobId) return;
    const { error } = await supabase.from('jobs').update({ status, ...(errorMessage ? { error_message: errorMessage } : {}) }).eq('id', jobId);
    if (error) throw new Error(`Failed to persist scan job status: ${error.message}`);
  };
  const finish = async (result: VisibilityScanPipelineResult) => {
    if (!jobId) return result;
    try { await setJobStatus(result.status === 'failed' ? 'failed' : 'completed', result.error); return result; }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to persist scan job status.';
      return { ...result, status: 'failed', error: result.error ? `${result.error}; ${message}` : message };
    }
  };

  try {
    await setJobStatus('running');

    const contextQuery = await supabase.from('business_context_versions')
      .select('id, industry, description, value_proposition, target_audience')
      .eq('project_id', projectId).order('created_at', { ascending: false }).limit(1);
    if (contextQuery.error) throw new Error(`Failed to load business context: ${contextQuery.error.message}`);

    let currentVersion = contextQuery.data?.[0];
    if (!currentVersion) {
      const { runBusinessContextPipeline } = await import('@ai-visibility-os/context');
      const contextResult = await runBusinessContextPipeline(supabase, { projectId });
      if (contextResult.status === 'failed' || !contextResult.contextVersionId) {
        return finish({ projectId, scansExecuted: 0, status: 'failed', error: contextResult.error || 'Failed to prepare business profile for scan execution.' });
      }
      const refreshed = await supabase.from('business_context_versions')
        .select('id, industry, description, value_proposition, target_audience')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(1);
      if (refreshed.error) throw new Error(`Failed to reload business context: ${refreshed.error.message}`);
      currentVersion = refreshed.data?.[0];
    }
    if (!currentVersion) return finish({ projectId, scansExecuted: 0, status: 'failed', error: 'Failed to retrieve business profile version.' });

    const domainQuery = await supabase.from('domains').select('id, host').eq('project_id', projectId).order('is_primary', { ascending: false }).limit(1);
    if (domainQuery.error) throw new Error(`Failed to load project domain: ${domainQuery.error.message}`);
    const targetDomainName = options.targetDomainName || domainQuery.data?.[0]?.host || '';
    if (!targetDomainName) return finish({ projectId, scansExecuted: 0, status: 'failed', error: 'Project has no configured domain.' });

    const competitorQuery = await supabase.from('competitors').select('id, status, domains!inner(host)').eq('project_id', projectId).eq('status', 'confirmed');
    if (competitorQuery.error) throw new Error(`Failed to load confirmed competitors: ${competitorQuery.error.message}`);
    const competitorHostMap = new Map<string, string>();
    for (const competitor of competitorQuery.data || []) {
      const host = (competitor.domains as unknown as { host?: string } | null)?.host;
      if (host) competitorHostMap.set(host.toLowerCase().replace(/^www\./, ''), competitor.id);
    }

    const providerQuery = await supabase.from('providers')
      .select('id, slug, display_name, adapter, primary_model, fallback_models, base_url, is_active, is_default')
      .eq('is_active', true).eq('is_default', true).maybeSingle();
    if (providerQuery.error) throw new Error(`Failed to load active default AI provider: ${providerQuery.error.message}`);
    if (!providerQuery.data) return finish({ projectId, scansExecuted: 0, status: 'failed', error: 'No active default AI provider is configured.' });

    const providerConfig = providerQuery.data;
    const providerId = providerConfig.id;
    const provider = getProvider(providerConfig.slug);
    const fields: BusinessContextFieldRecord[] = [
      { field_name: 'industry', field_value: currentVersion.industry || '' },
      { field_name: 'description', field_value: currentVersion.description || '' },
      { field_name: 'value_proposition', field_value: currentVersion.value_proposition || '' },
      { field_name: 'target_audience', field_value: currentVersion.target_audience || '' },
    ];
    const generatedPrompts = generatePromptsFromContext(fields);
    const syncedPrompts = await syncPromptLibrary(supabase, projectId, generatedPrompts);
    if (!syncedPrompts.length) return finish({ projectId, scansExecuted: 0, status: 'failed', error: 'No active query prompts available for scan execution.' });

    let scansExecuted = 0;
    let lastScanErrorMessage: string | undefined;
    const normalizedTargetDomain = targetDomainName.toLowerCase().replace(/^www\./, '');

    for (const promptObj of syncedPrompts) {
      const now = new Date().toISOString();
      const { data: scan, error: scanInsertError } = await supabase.from('ai_scans').insert({
        project_id: projectId,
        provider_id: providerId,
        business_context_version_id: currentVersion.id,
        prompt_library_id: promptObj.id,
        prompt_text: promptObj.prompt_text,
        model_name: provider.modelName,
        status: 'running',
        started_at: now,
      }).select('id, provider_id').single();
      if (scanInsertError || !scan) { lastScanErrorMessage = scanInsertError?.message || 'Failed to insert scan record.'; continue; }

      try {
        const groundedResult = await provider.runGroundedQuery(promptObj.prompt_text);
        const citationRows = groundedResult.citations.filter((c) => c.sourceUrl?.trim()).map((citation, idx) => {
          const url = /^https?:\/\//i.test(citation.sourceUrl.trim()) ? citation.sourceUrl.trim() : `https://${citation.sourceUrl.trim()}`;
          const normDomain = citation.sourceDomain.toLowerCase().replace(/^www\./, '');
          const isOwn = normDomain === normalizedTargetDomain || normDomain.endsWith(`.${normalizedTargetDomain}`);
          return { ai_scan_id: scan.id, url, title: citation.anchorText || null, position: idx + 1, is_own_domain: isOwn, competitor_id: isOwn ? null : (competitorHostMap.get(normDomain) || null) };
        });
        if (citationRows.length) {
          const { error } = await supabase.from('citations').insert(citationRows);
          if (error) throw new Error(`Failed to persist scan citations: ${error.message}`);
        }

        const analysis = await provider.analyzeResponse(promptObj.prompt_text, groundedResult.rawText, groundedResult.citations, targetDomainName);
        for (const entityItem of analysis.entitiesDetected) {
          const trimmedName = entityItem.name?.trim();
          if (!trimmedName) continue;
          let trackedEntityId: string | null = null;
          const { data: existingEntity, error: lookupError } = await supabase.from('tracked_entities').select('id').ilike('name', trimmedName).limit(1).maybeSingle();
          if (lookupError) throw new Error(`Failed to load tracked entity: ${lookupError.message}`);
          if (existingEntity) trackedEntityId = existingEntity.id;
          else {
            const { data: newEntity, error: insertError } = await supabase.from('tracked_entities').insert({ name: trimmedName, entity_type: validateEntityType(entityItem.entityType) }).select('id').single();
            if (newEntity) trackedEntityId = newEntity.id;
            else if (insertError?.code === '23505') {
              const { data: reloaded, error: reloadError } = await supabase.from('tracked_entities').select('id').ilike('name', trimmedName).limit(1).maybeSingle();
              if (reloadError) throw new Error(`Failed to reload tracked entity: ${reloadError.message}`);
              trackedEntityId = reloaded?.id || null;
            } else if (insertError) throw new Error(`Failed to persist tracked entity: ${insertError.message}`);
          }
          if (trackedEntityId) {
            const { error } = await supabase.from('entity_mentions').insert({ tracked_entity_id: trackedEntityId, ai_scan_id: scan.id, context_snippet: entityItem.snippet ?? null, sentiment: mapSentiment(entityItem.sentiment ?? analysis.sentiment) });
            if (error) throw new Error(`Failed to persist entity mention: ${error.message}`);
          }
        }

        const { error: finalizeError } = await supabase.from('ai_scans').update({
          status: 'completed', is_mentioned: analysis.mentioned, mention_position: analysis.rankPosition || null,
          sentiment: mapSentiment(analysis.sentiment), summary_markdown: analysis.summary, raw_response: groundedResult.rawText,
          completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', scan.id);
        if (finalizeError) throw new Error(`Failed to finalize scan result: ${finalizeError.message}`);
        scansExecuted++;
      } catch (scanErr) {
        const errMsg = scanErr instanceof Error ? scanErr.message : 'Scan execution error.';
        lastScanErrorMessage = errMsg;
        const { error } = await supabase.from('ai_scans').update({ status: 'failed', error_message: errMsg, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', scan.id);
        if (error) lastScanErrorMessage = `${errMsg}; failed to persist scan failure: ${error.message}`;
      }
    }

    return finish({ projectId, scansExecuted, status: scansExecuted > 0 ? 'completed' : 'failed', error: scansExecuted > 0 ? undefined : (lastScanErrorMessage || 'Scan execution failed for all query prompts.') });
  } catch (error) {
    return finish({ projectId, scansExecuted: 0, status: 'failed', error: error instanceof Error ? error.message : 'Visibility scan pipeline error.' });
  }
}
