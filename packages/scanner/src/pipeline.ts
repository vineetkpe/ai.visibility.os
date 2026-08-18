import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  VisibilityScanPipelineOptions,
  VisibilityScanPipelineResult,
  BusinessContextFieldRecord,
} from './types';
import { getProvider } from './registry';
import { generatePromptsFromContext, syncPromptLibrary } from './prompts/generator';

type ValidEntityType = 'organization' | 'person' | 'brand' | 'location' | 'other';

function mapSentiment(
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed' | string | null
): 'positive' | 'neutral' | 'negative' | null {
  if (!sentiment) return null;
  if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
    return sentiment;
  }
  return 'neutral';
}

function validateEntityType(rawType?: string | null): ValidEntityType {
  if (!rawType) return 'other';
  const normalized = rawType.toLowerCase().trim();
  const validTypes: ValidEntityType[] = ['organization', 'person', 'brand', 'location', 'other'];
  if (validTypes.includes(normalized as ValidEntityType)) {
    return normalized as ValidEntityType;
  }
  return 'other';
}

export async function runVisibilityScanPipeline(
  supabase: SupabaseClient<Database>,
  options: VisibilityScanPipelineOptions
): Promise<VisibilityScanPipelineResult> {
  const { projectId, jobId } = options;

  const setJobStatus = async (status: 'running' | 'completed' | 'failed', errorMessage?: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status, ...(errorMessage ? { error_message: errorMessage } : {}) })
      .eq('id', jobId!);
    if (error) throw new Error(`Failed to persist scan job status: ${error.message}`);
  };

  const finish = async (result: VisibilityScanPipelineResult): Promise<VisibilityScanPipelineResult> => {
    if (!jobId) return result;
    try {
      await setJobStatus(result.status === 'failed' ? 'failed' : 'completed', result.error);
      return result;
    } catch (statusError) {
      const statusMessage = statusError instanceof Error ? statusError.message : 'Failed to persist scan job status.';
      return {
        ...result,
        status: 'failed',
        error: result.error ? `${result.error}; ${statusMessage}` : statusMessage,
      };
    }
  };

  try {
    if (jobId) await setJobStatus('running');

    const contextQuery = await supabase
      .from('business_context_versions')
      .select('id, industry, description, value_proposition, target_audience')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    let currentVersions = contextQuery.data;
    if (contextQuery.error) {
      throw new Error(`Failed to load business context: ${contextQuery.error.message}`);
    }

    if (!currentVersions || currentVersions.length === 0) {
      const { runBusinessContextPipeline } = await import('@ai-visibility-os/context');
      const contextResult = await runBusinessContextPipeline(supabase, { projectId });
      if (contextResult.status === 'failed' || !contextResult.contextVersionId) {
        return finish({
          projectId,
          scansExecuted: 0,
          status: 'failed',
          error: contextResult.error || 'Failed to prepare business profile for scan execution.',
        });
      }

      const refreshedContext = await supabase
        .from('business_context_versions')
        .select('id, industry, description, value_proposition, target_audience')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (refreshedContext.error) {
        throw new Error(`Failed to reload business context: ${refreshedContext.error.message}`);
      }
      currentVersions = refreshedContext.data;
    }

    if (!currentVersions || currentVersions.length === 0) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'Failed to retrieve business profile version.',
      });
    }

    const currentVersion = currentVersions[0];
    if (!currentVersion) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'Current business context version record is missing.',
      });
    }

    const businessContextVersionId = currentVersion.id;

    const fields: BusinessContextFieldRecord[] = [
      { field_name: 'industry', field_value: currentVersion.industry || '' },
      { field_name: 'description', field_value: currentVersion.description || '' },
      { field_name: 'value_proposition', field_value: currentVersion.value_proposition || '' },
    ];

    const domainQuery = await supabase
      .from('domains')
      .select('id, host')
      .eq('project_id', projectId)
      .limit(1);
    if (domainQuery.error) {
      throw new Error(`Failed to load project domain: ${domainQuery.error.message}`);
    }
    const targetDomainName = options.targetDomainName || domainQuery.data?.[0]?.host || 'example.com';

    const competitorQuery = await supabase
      .from('competitors')
      .select('id, status, domains!inner(host)')
      .eq('project_id', projectId)
      .eq('status', 'confirmed');
    if (competitorQuery.error) {
      throw new Error(`Failed to load confirmed competitors: ${competitorQuery.error.message}`);
    }

    const competitorHostMap = new Map<string, string>();
    if (competitorQuery.data) {
      for (const c of competitorQuery.data) {
        const domainHost = (c.domains as unknown as { host?: string } | null)?.host;
        if (domainHost) {
          competitorHostMap.set(domainHost.toLowerCase().replace(/^www\./, ''), c.id);
        }
      }
    }

    const providerQuery = await supabase
      .from('providers')
      .select('id')
      .eq('slug', 'gemini')
      .maybeSingle();
    if (providerQuery.error) {
      throw new Error(`Failed to load Gemini provider: ${providerQuery.error.message}`);
    }
    if (!providerQuery.data) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'Active Gemini provider record not found in database.',
      });
    }

    const providerId = providerQuery.data.id;
    const generatedPrompts = generatePromptsFromContext(fields);
    const syncedPrompts = await syncPromptLibrary(supabase, projectId, generatedPrompts);

    if (syncedPrompts.length === 0) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'No active query prompts available for scan execution.',
      });
    }

    const provider = getProvider('gemini');
    let scansExecuted = 0;
    let lastScanErrorMessage: string | undefined;
    const normalizedTargetDomain = targetDomainName.toLowerCase().replace(/^www\./, '');

    for (const promptObj of syncedPrompts) {
      const promptText = promptObj.prompt_text;
      const now = new Date().toISOString();

      const { data: scan, error: scanInsertError } = await supabase
        .from('ai_scans')
        .insert({
          project_id: projectId,
          provider_id: providerId,
          business_context_version_id: businessContextVersionId,
          prompt_library_id: promptObj.id,
          prompt_text: promptText,
          model_name: provider.modelName,
          status: 'running',
          started_at: now,
        })
        .select('id')
        .single();

      if (scanInsertError || !scan) {
        lastScanErrorMessage = scanInsertError?.message || 'Failed to insert scan record.';
        continue;
      }

      try {
        const groundedResult = await provider.runGroundedQuery(promptText);

        if (groundedResult.citations.length > 0) {
          const citationRows = groundedResult.citations
            .filter((c) => c.sourceUrl && c.sourceUrl.trim().length > 0)
            .map((c, idx) => {
              let validUrl = c.sourceUrl.trim();
              if (!/^https?:\/\//i.test(validUrl)) validUrl = `https://${validUrl}`;

              const normDomain = c.sourceDomain.toLowerCase().replace(/^www\./, '');
              const isOwn =
                normDomain === normalizedTargetDomain ||
                c.sourceDomain.toLowerCase().endsWith(`.${normalizedTargetDomain}`);

              return {
                ai_scan_id: scan.id,
                url: validUrl,
                title: c.anchorText || null,
                position: idx + 1,
                is_own_domain: isOwn,
                competitor_id: isOwn ? null : (competitorHostMap.get(normDomain) || null),
              };
            });

          if (citationRows.length > 0) {
            const { error: citationError } = await supabase.from('citations').insert(citationRows);
            if (citationError) throw new Error(`Failed to persist scan citations: ${citationError.message}`);
          }
        }

        const analysis = await provider.analyzeResponse(
          promptText,
          groundedResult.rawText,
          groundedResult.citations,
          targetDomainName
        );

        if (analysis.entitiesDetected.length > 0) {
          for (const entityItem of analysis.entitiesDetected) {
            if (!entityItem.name || !entityItem.name.trim()) continue;

            const trimmedName = entityItem.name.trim();
            let trackedEntityId: string | null = null;
            const { data: existingEntity, error: entityLookupError } = await supabase
              .from('tracked_entities')
              .select('id')
              .ilike('name', trimmedName)
              .limit(1)
              .maybeSingle();
            if (entityLookupError) throw new Error(`Failed to load tracked entity: ${entityLookupError.message}`);

            if (existingEntity) {
              trackedEntityId = existingEntity.id;
            } else {
              const validatedType = validateEntityType(entityItem.entityType);
              const { data: newEntity, error: insertErr } = await supabase
                .from('tracked_entities')
                .insert({ name: trimmedName, entity_type: validatedType })
                .select('id')
                .single();

              if (newEntity) {
                trackedEntityId = newEntity.id;
              } else if (
                insertErr &&
                (insertErr.code === '23505' || insertErr.message?.includes('uq_tracked_entities_name_lower'))
              ) {
                const { data: reSelectEntity, error: reSelectError } = await supabase
                  .from('tracked_entities')
                  .select('id')
                  .ilike('name', trimmedName)
                  .limit(1)
                  .maybeSingle();
                if (reSelectError) throw new Error(`Failed to reload tracked entity: ${reSelectError.message}`);
                if (reSelectEntity) trackedEntityId = reSelectEntity.id;
              } else if (insertErr) {
                throw new Error(`Failed to persist tracked entity: ${insertErr.message}`);
              }
            }

            if (trackedEntityId) {
              const { error: mentionError } = await supabase.from('entity_mentions').insert({
                tracked_entity_id: trackedEntityId,
                ai_scan_id: scan.id,
                context_snippet: entityItem.snippet ?? null,
                sentiment: mapSentiment(entityItem.sentiment ?? analysis.sentiment),
              });
              if (mentionError) throw new Error(`Failed to persist entity mention: ${mentionError.message}`);
            }
          }
        }

        const { error: scanUpdateError } = await supabase
          .from('ai_scans')
          .update({
            status: 'completed',
            is_mentioned: analysis.mentioned,
            mention_position: analysis.rankPosition || null,
            sentiment: mapSentiment(analysis.sentiment),
            summary_markdown: analysis.summary,
            raw_response: groundedResult.rawText,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', scan.id);
        if (scanUpdateError) throw new Error(`Failed to finalize scan result: ${scanUpdateError.message}`);

        scansExecuted++;
      } catch (scanErr: unknown) {
        let errMsg = scanErr instanceof Error ? scanErr.message : typeof scanErr === 'string' ? scanErr : 'Scan execution error.';
        if (errMsg.startsWith('{') && errMsg.includes('"message"')) {
          try {
            const parsed = JSON.parse(errMsg);
            if (parsed.error?.message) errMsg = parsed.error.message;
          } catch {
            // Keep original message.
          }
        }
        lastScanErrorMessage = errMsg;

        const { error: scanFailureUpdateError } = await supabase
          .from('ai_scans')
          .update({
            status: 'failed',
            error_message: errMsg,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', scan.id);

        if (scanFailureUpdateError) {
          lastScanErrorMessage = `${errMsg}; failed to persist scan failure: ${scanFailureUpdateError.message}`;
        }
      }
    }

    return finish({
      projectId,
      scansExecuted,
      status: scansExecuted > 0 ? 'completed' : 'failed',
      error: scansExecuted > 0 ? undefined : (lastScanErrorMessage || 'Scan execution failed for all query prompts.'),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Visibility scan pipeline error.';
    return finish({
      projectId,
      scansExecuted: 0,
      status: 'failed',
      error: errorMsg,
    });
  }
}
