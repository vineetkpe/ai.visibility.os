import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  ExtractedField,
  PageRecord,
  BusinessContextPipelineOptions,
  BusinessContextPipelineResult,
} from './types';
import { extractDeterministicFields } from './deterministic';
import { synthesizeBusinessContextWithAi } from './ai-synthesis';

/**
 * Case-insensitive trimmed deduplication of extracted fields within a single version.
 */
export function deduplicateFields(fields: ExtractedField[]): ExtractedField[] {
  const seen = new Map<string, ExtractedField>();

  for (const field of fields) {
    const trimmedVal = field.fieldValue.trim();
    if (!trimmedVal) continue;

    const key = `${field.fieldName.toLowerCase()}:${trimmedVal.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { ...field, fieldValue: trimmedVal });
    } else {
      // If candidate is deterministic and existing is ai_inferred, upgrade to deterministic
      if (field.extractionMethod === 'deterministic' && existing.extractionMethod === 'ai_inferred') {
        seen.set(key, { ...field, fieldValue: trimmedVal });
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Executes the complete Business Context Engine pipeline for a target project.
 */
export async function runBusinessContextPipeline(
  supabase: SupabaseClient<Database>,
  options: BusinessContextPipelineOptions
): Promise<BusinessContextPipelineResult> {
  const { projectId, generationMethod = 'hybrid_v1' } = options;

  try {
    // 1. Fetch active primary domain for the project
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .limit(1);

    if (domainError || !domains || domains.length === 0) {
      return {
        projectId,
        contextVersionId: '',
        versionNumber: 0,
        fieldsExtracted: 0,
        status: 'failed',
        error: 'No active domain found for project.',
      };
    }

    const domainId = domains[0]?.id as string;

    // 2. Fetch completed crawled pages for the domain
    const { data: rawPages, error: pagesError } = await supabase
      .from('pages')
      .select(
        'id, url, title, meta_description, canonical_url, language, organization_details, json_ld, social_links, headings, word_count'
      )
      .eq('domain_id', domainId)
      .eq('crawl_status', 'completed')
      .order('created_at', { ascending: true });

    if (pagesError || !rawPages || rawPages.length === 0) {
      return {
        projectId,
        contextVersionId: '',
        versionNumber: 0,
        fieldsExtracted: 0,
        status: 'failed',
        error: 'No completed crawl pages available for context synthesis.',
      };
    }

    const pages = rawPages as unknown as PageRecord[];

    // 3. Deterministic Extraction Pass
    const deterministicFields = extractDeterministicFields(pages);

    // 4. AI Inferred Synthesis Pass (Gemini)
    const aiFields = await synthesizeBusinessContextWithAi(pages);

    // 5. Deduplicate combined field set
    const allFields = [...deterministicFields, ...aiFields];
    const deduplicated = deduplicateFields(allFields);

    if (deduplicated.length === 0) {
      return {
        projectId,
        contextVersionId: '',
        versionNumber: 0,
        fieldsExtracted: 0,
        status: 'failed',
        error: 'No business context fields could be extracted.',
      };
    }

    // 6. Version Resolution & Database Transaction
    // Fetch latest version number for project
    const { data: existingVersions } = await supabase
      .from('business_context_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = existingVersions && existingVersions.length > 0
      ? (existingVersions[0]?.version_number ?? 0) + 1
      : 1;

    // Set all previous versions for project to is_current = false
    await supabase
      .from('business_context_versions')
      .update({ is_current: false })
      .eq('project_id', projectId)
      .eq('is_current', true);

    // Insert new version row
    const { data: newVersion, error: versionInsertError } = await supabase
      .from('business_context_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        is_current: true,
        generation_method: generationMethod,
      })
      .select('id')
      .single();

    if (versionInsertError || !newVersion) {
      return {
        projectId,
        contextVersionId: '',
        versionNumber: nextVersionNumber,
        fieldsExtracted: 0,
        status: 'failed',
        error: versionInsertError?.message || 'Failed to create business context version record.',
      };
    }

    // Insert deduplicated business_context_fields rows
    const fieldRows = deduplicated.map((f) => ({
      context_version_id: newVersion.id,
      field_name: f.fieldName,
      field_value: f.fieldValue,
      confidence_score: f.confidenceScore,
      source_page_id: f.sourcePageId,
      extraction_method: f.extractionMethod,
    }));

    const { error: fieldsInsertError } = await supabase
      .from('business_context_fields')
      .insert(fieldRows);

    if (fieldsInsertError) {
      return {
        projectId,
        contextVersionId: newVersion.id,
        versionNumber: nextVersionNumber,
        fieldsExtracted: 0,
        status: 'failed',
        error: fieldsInsertError.message || 'Failed to persist business context fields.',
      };
    }

    return {
      projectId,
      contextVersionId: newVersion.id,
      versionNumber: nextVersionNumber,
      fieldsExtracted: fieldRows.length,
      status: 'completed',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Business Context pipeline error.';
    return {
      projectId,
      contextVersionId: '',
      versionNumber: 0,
      fieldsExtracted: 0,
      status: 'failed',
      error: errorMsg,
    };
  }
}
