import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  VisibilityScanPipelineOptions,
  VisibilityScanPipelineResult,
  BusinessContextFieldRecord,
} from './types';
import { GeminiProvider } from './providers/gemini';
import { generatePromptsFromContext, syncPromptLibrary } from './prompts/generator';

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
    const domainId = domains?.[0]?.id;

    // Fetch existing crawled pages for page_scans matching
    let crawledPages: Array<{ id: string; url: string }> = [];
    if (domainId) {
      const { data: pData } = await supabase
        .from('pages')
        .select('id, url')
        .eq('domain_id', domainId);
      if (pData) crawledPages = pData;
    }

    // Fetch active provider id for Gemini
    const { data: providerRow } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', 'gemini')
      .maybeSingle();

    const providerId = providerRow?.id || '00000000-0000-0000-0000-000000000000';

    // 4. Generate & Sync Prompts to prompt_library
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

    // 5. Execute Scan pipeline for each prompt
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
            const isOwn =
              c.sourceDomain.toLowerCase().replace(/^www\./, '') === normalizedTargetDomain ||
              c.sourceDomain.toLowerCase().endsWith(`.${normalizedTargetDomain}`);
            return {
              ai_scan_id: scan.id,
              url: c.sourceUrl,
              title: c.anchorText || null,
              position: c.order,
              is_own_domain: isOwn,
            };
          });

          await supabase.from('citations').insert(citationRows);

          // Check if any citation matches a known crawled page in pages
          for (const c of groundedResult.citations) {
            const matchedPage = crawledPages.find(
              (p) => p.url.toLowerCase() === c.sourceUrl.toLowerCase()
            );
            if (matchedPage) {
              await supabase.from('page_scans').insert({
                scan_id: scan.id,
                page_id: matchedPage.id,
                sentiment_score:
                  analysis.sentiment === 'positive'
                    ? 1.0
                    : analysis.sentiment === 'negative'
                      ? -1.0
                      : 0.0,
                rank_position: c.order,
                snippet_extracted: c.anchorText || null,
              });
            }
          }
        }

        // Persist Entities & Entity Mentions
        if (analysis.entitiesDetected.length > 0) {
          for (const entityItem of analysis.entitiesDetected) {
            // Upsert entity into entities lookup table
            const { data: entityObj } = await supabase
              .from('entities')
              .upsert(
                { name: entityItem.name, entity_type: entityItem.entityType },
                { onConflict: 'name' }
              )
              .select('id')
              .single();

            if (entityObj) {
              await supabase.from('entity_mentions').insert({
                entity_id: entityObj.id,
                scan_id: scan.id,
                context_snippet: entityItem.snippet || null,
                sentiment: entityItem.sentiment || analysis.sentiment || 'neutral',
              });
            }
          }
        }

        // Update scan status to completed
        await supabase
          .from('ai_scans')
          .update({
            status: 'completed',
            is_mentioned: analysis.mentioned,
            mention_position: analysis.rankPosition || null,
            sentiment: analysis.sentiment || null,
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
