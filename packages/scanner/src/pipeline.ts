import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  VisibilityScanPipelineOptions,
  VisibilityScanPipelineResult,
  BusinessContextFieldRecord,
} from './types';
import { getProvider } from './registry';
import { generatePromptsFromContext, syncPromptLibrary } from './prompts/generator';

type ValidEntityType = 'organization' | 'person' | 'brand' | 'location' | 'other';

/**
 * Maps provider sentiment string (which may include 'mixed') to the database sentiment_type enum ('positive' | 'neutral' | 'negative').
 */
function mapSentiment(
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed' | string | null
): 'positive' | 'neutral' | 'negative' | null {
  if (!sentiment) return null;
  if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
    return sentiment;
  }
  return 'neutral';
}

/**
 * Validates and normalizes free-form entity type string against public.entity_type enum.
 */
function validateEntityType(rawType?: string | null): ValidEntityType {
  if (!rawType) return 'other';
  const normalized = rawType.toLowerCase().trim();
  const validTypes: ValidEntityType[] = ['organization', 'person', 'brand', 'location', 'other'];
  if (validTypes.includes(normalized as ValidEntityType)) {
    return normalized as ValidEntityType;
  }
  return 'other';
}

/**
 * Executes the complete AI Visibility Engine scanning pipeline for a target project using Gemini 3.6 Flash.
 */
export async function runVisibilityScanPipeline(
  supabase: SupabaseClient<Database>,
  options: VisibilityScanPipelineOptions
): Promise<VisibilityScanPipelineResult> {
  const { projectId, jobId } = options;

  if (jobId) {
    await supabase.from('jobs').update({ status: 'running' }).eq('id', jobId);
  }

  const finish = async (result: VisibilityScanPipelineResult): Promise<VisibilityScanPipelineResult> => {
    if (jobId) {
      if (result.status === 'failed') {
        await supabase
          .from('jobs')
          .update({ status: 'failed', error_message: result.error || 'Visibility scan failed.' })
          .eq('id', jobId);
      } else {
        await supabase
          .from('jobs')
          .update({ status: 'completed' })
          .eq('id', jobId);
      }
    }
    return result;
  };

  try {
    // 1. Require a valid current business_context_versions row (resolved via created_at DESC)
    const { data: currentVersions, error: versionError } = await supabase
      .from('business_context_versions')
      .select('id, industry, description, value_proposition, target_audience')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (versionError || !currentVersions || currentVersions.length === 0) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error:
          'Scan generation requires a current business context version. Please generate business context first.',
      });
    }

    const currentVersion = currentVersions[0];
    if (!currentVersion) {
      return {
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'Current business context version record is missing.',
      };
    }

    const businessContextVersionId = currentVersion.id;

    // 2. Build context text from business_context_versions
    const fields: BusinessContextFieldRecord[] = [
      { field_name: 'industry', field_value: currentVersion.industry || '' },
      { field_name: 'description', field_value: currentVersion.description || '' },
      { field_name: 'value_proposition', field_value: currentVersion.value_proposition || '' },
    ];

    // 3. Fetch primary domain for project
    const { data: domains } = await supabase
      .from('domains')
      .select('id, host')
      .eq('project_id', projectId)
      .limit(1);

    const targetDomainName = options.targetDomainName || domains?.[0]?.host || 'example.com';

    // 4. Fetch CONFIRMED competitors for citation matching
    const { data: confirmedCompetitors } = await supabase
      .from('competitors')
      .select('id, status, domains!inner(host)')
      .eq('project_id', projectId)
      .eq('status', 'confirmed');

    const competitorHostMap = new Map<string, string>();
    if (confirmedCompetitors) {
      for (const c of confirmedCompetitors) {
        const domainHost = (c.domains as unknown as { host?: string } | null)?.host;
        if (domainHost) {
          const normalizedHost = domainHost.toLowerCase().replace(/^www\./, '');
          competitorHostMap.set(normalizedHost, c.id);
        }
      }
    }

    // Fetch active provider id for Gemini
    const { data: providerRow } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', 'gemini')
      .maybeSingle();

    if (!providerRow) {
      return finish({
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'Active Gemini provider record not found in database.',
      });
    }

    const providerId = providerRow.id;

    // 5. Generate & Sync Prompts to prompt_library
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
    let lastScanErrorMessage: string | undefined = undefined;
    const normalizedTargetDomain = targetDomainName.toLowerCase().replace(/^www\./, '');

    // 6. Execute Scan pipeline for each prompt
    for (const promptObj of syncedPrompts) {
      const promptText = promptObj.prompt_text;
      const now = new Date().toISOString();

      // Insert pending/running scan row (ALWAYS persisting business_context_version_id)
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
        console.error('Scan insert failed:', scanInsertError?.message);
        lastScanErrorMessage = scanInsertError?.message || 'Failed to insert scan record.';
        continue;
      }

      try {
        // Call 1: Grounded Search Query
        const groundedResult = await provider.runGroundedQuery(promptText);

        // Persist real Citations from Call 1 immediately
        if (groundedResult.citations.length > 0) {
          const citationRows = groundedResult.citations
            .filter((c) => c.sourceUrl && c.sourceUrl.trim().length > 0)
            .map((c, idx) => {
              let validUrl = c.sourceUrl.trim();
              if (!/^https?:\/\//i.test(validUrl)) {
                validUrl = `https://${validUrl}`;
              }

              const normDomain = c.sourceDomain.toLowerCase().replace(/^www\./, '');
              const isOwn =
                normDomain === normalizedTargetDomain ||
                c.sourceDomain.toLowerCase().endsWith(`.${normalizedTargetDomain}`);

              const matchedCompetitorId = isOwn ? null : (competitorHostMap.get(normDomain) || null);

              return {
                ai_scan_id: scan.id,
                url: validUrl,
                title: c.anchorText || null,
                position: idx + 1,
                is_own_domain: isOwn,
                competitor_id: matchedCompetitorId,
              };
            });

          if (citationRows.length > 0) {
            await supabase.from('citations').insert(citationRows);
          }
        }

        // Call 2: Structured Response Analysis
        const analysis = await provider.analyzeResponse(
          promptText,
          groundedResult.rawText,
          groundedResult.citations,
          targetDomainName
        );

        // Persist Tracked Entities & Entity Mentions
        if (analysis.entitiesDetected.length > 0) {
          for (const entityItem of analysis.entitiesDetected) {
            if (!entityItem.name || !entityItem.name.trim()) continue;

            const trimmedName = entityItem.name.trim();
            let trackedEntityId: string | null = null;

            // Check if entity already exists in tracked_entities (case-insensitive)
            const { data: existingEntity } = await supabase
              .from('tracked_entities')
              .select('id')
              .ilike('name', trimmedName)
              .limit(1)
              .maybeSingle();

            if (existingEntity) {
              trackedEntityId = existingEntity.id;
            } else {
              // Insert new tracked_entity with validated entity_type
              const validatedType = validateEntityType(entityItem.entityType);
              const { data: newEntity, error: insertErr } = await supabase
                .from('tracked_entities')
                .insert({
                  name: trimmedName,
                  entity_type: validatedType,
                })
                .select('id')
                .single();

              if (newEntity) {
                trackedEntityId = newEntity.id;
              } else if (
                insertErr &&
                (insertErr.code === '23505' ||
                  insertErr.message?.includes('uq_tracked_entities_name_lower'))
              ) {
                // Race condition handling: re-SELECT on unique violation
                const { data: reSelectEntity } = await supabase
                  .from('tracked_entities')
                  .select('id')
                  .ilike('name', trimmedName)
                  .limit(1)
                  .maybeSingle();

                if (reSelectEntity) {
                  trackedEntityId = reSelectEntity.id;
                }
              }
            }

            if (trackedEntityId) {
              await supabase.from('entity_mentions').insert({
                tracked_entity_id: trackedEntityId,
                ai_scan_id: scan.id,
                context_snippet: entityItem.snippet ?? null,
                sentiment: mapSentiment(entityItem.sentiment ?? analysis.sentiment),
              });
            }
          }
        }

        // Update scan status to completed with mapped sentiment
        await supabase
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

        scansExecuted++;
      } catch (scanErr: unknown) {
        let errMsg = 'Scan execution error.';
        if (scanErr instanceof Error) {
          errMsg = scanErr.message;
        } else if (typeof scanErr === 'string') {
          errMsg = scanErr;
        }
        if (errMsg.startsWith('{') && errMsg.includes('"message"')) {
          try {
            const parsed = JSON.parse(errMsg);
            if (parsed.error?.message) {
              errMsg = parsed.error.message;
            }
          } catch {
            // Keep original
          }
        }
        lastScanErrorMessage = errMsg;

        await supabase
          .from('ai_scans')
          .update({
            status: 'failed',
            error_message: errMsg,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', scan.id);
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
