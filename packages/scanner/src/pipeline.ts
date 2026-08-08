import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  VisibilityScanPipelineOptions,
  VisibilityScanPipelineResult,
  BusinessContextFieldRecord,
} from './types';
import { GeminiProvider } from './providers/gemini';
import { generatePromptsFromContext, syncPromptLibrary } from './prompts/generator';

type ValidEntityType = 'organization' | 'person' | 'brand' | 'location' | 'other';

/**
 * Maps provider sentiment string (which may include 'mixed') to the database sentiment_type enum.
 */
function mapSentiment(
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed' | string | null
): 'positive' | 'neutral' | 'negative' | null {
  if (!sentiment) return null;
  if (sentiment === 'mixed') return 'neutral';
  if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
    return sentiment;
  }
  return 'neutral';
}

/**
 * Validates and normalizes free-form entity type string against tracked_entities.entity_type enum.
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
  const { projectId } = options;

  try {
    // 1. Verify project has a current business context version
    const { data: currentVersions, error: versionError } = await supabase
      .from('business_context_versions')
      .select('id, industry, description, value_proposition, target_audience')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (versionError || !currentVersions || currentVersions.length === 0) {
      return {
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error:
          'Scan generation requires a current business context. Please generate business context first.',
      };
    }

    const currentVersion = currentVersions[0];

    // 2. Build context text from business_context_versions
    const fields: BusinessContextFieldRecord[] = [
      { field_name: 'industry', field_value: currentVersion?.industry || '' },
      { field_name: 'description', field_value: currentVersion?.description || '' },
      { field_name: 'value_proposition', field_value: currentVersion?.value_proposition || '' },
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

    const providerId = providerRow?.id || '00000000-0000-0000-0000-000000000000';

    // 5. Generate & Sync Prompts to prompt_library
    const generatedPrompts = generatePromptsFromContext(fields);
    const syncedPrompts = await syncPromptLibrary(supabase, projectId, generatedPrompts);

    if (syncedPrompts.length === 0) {
      return {
        projectId,
        scansExecuted: 0,
        status: 'failed',
        error: 'No active query prompts available for scan execution.',
      };
    }

    const provider = new GeminiProvider();
    let scansExecuted = 0;
    const normalizedTargetDomain = targetDomainName.toLowerCase().replace(/^www\./, '');

    // 6. Execute Scan pipeline for each prompt
    for (const promptObj of syncedPrompts) {
      const promptText = promptObj.prompt_text;
      const now = new Date().toISOString();

      // Insert pending/running scan row
      const { data: scan, error: scanInsertError } = await supabase
        .from('ai_scans')
        .insert({
          project_id: projectId,
          provider_id: providerId,
          prompt_library_id: promptObj.id,
          prompt_text: promptText,
          model_name: provider.modelName,
          status: 'running',
          started_at: now,
        })
        .select('id')
        .single();

      if (scanInsertError || !scan) {
        continue;
      }

      try {
        // Call 1: Grounded Search Query
        const groundedResult = await provider.runGroundedQuery(promptText);

        // Call 2: Structured Response Analysis
        const analysis = await provider.analyzeResponse(
          promptText,
          groundedResult.rawText,
          groundedResult.citations,
          targetDomainName
        );

        // Persist Citations
        if (groundedResult.citations.length > 0) {
          const citationRows = groundedResult.citations.map((c) => {
            const normDomain = c.sourceDomain.toLowerCase().replace(/^www\./, '');
            const isOwn =
              normDomain === normalizedTargetDomain ||
              c.sourceDomain.toLowerCase().endsWith(`.${normalizedTargetDomain}`);

            const matchedCompId = competitorHostMap.get(normDomain) || null;

            return {
              ai_scan_id: scan.id,
              url: c.sourceUrl,
              title: c.anchorText || null,
              position: c.order,
              is_own_domain: isOwn,
              competitor_id: matchedCompId,
            };
          });

          await supabase.from('citations').insert(citationRows);
        }

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
        const errMsg = scanErr instanceof Error ? scanErr.message : 'Scan execution error.';
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

    return {
      projectId,
      scansExecuted,
      status: scansExecuted > 0 ? 'completed' : 'failed',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Visibility scan pipeline error.';
    return {
      projectId,
      scansExecuted: 0,
      status: 'failed',
      error: errorMsg,
    };
  }
}
