import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { BusinessContextFieldRecord } from '../types';

export interface GeneratedPrompt {
  promptText: string;
  intent: 'informational' | 'comparison' | 'transactional' | 'navigational';
  sourceFields: string[];
}

/**
 * Generates search prompts from the business-context fields that the scanner
 * actually loads from business_context_versions.
 *
 * Do not invent company/product/service data here: those fields are not part
 * of the current business_context_versions projection used by the scanner.
 */
export function generatePromptsFromContext(
  fields: BusinessContextFieldRecord[]
): GeneratedPrompt[] {
  const getValue = (name: string) =>
    fields.find((field) => field.field_name === name)?.field_value?.trim() || '';

  const industry = getValue('industry');
  const description = getValue('description');
  const valueProposition = getValue('value_proposition');
  const targetAudience = getValue('target_audience');

  const prompts: GeneratedPrompt[] = [];

  if (industry) {
    prompts.push({
      promptText: `What are the best ${industry} solutions for businesses?`,
      intent: 'informational',
      sourceFields: ['industry'],
    });

    prompts.push({
      promptText: `What should businesses look for when choosing a ${industry} provider?`,
      intent: 'comparison',
      sourceFields: ['industry'],
    });
  }

  if (description) {
    prompts.push({
      promptText: `What companies or solutions are known for ${description}?`,
      intent: 'informational',
      sourceFields: ['description'],
    });
  }

  if (valueProposition) {
    prompts.push({
      promptText: `Which companies offer solutions that ${valueProposition}?`,
      intent: 'comparison',
      sourceFields: ['value_proposition'],
    });
  }

  if (targetAudience && industry) {
    prompts.push({
      promptText: `What are the best ${industry} options for ${targetAudience}?`,
      intent: 'transactional',
      sourceFields: ['industry', 'target_audience'],
    });
  }

  // A scan without usable business context should fail rather than silently
  // producing generic prompts that can generate misleading visibility data.
  if (prompts.length === 0) {
    return [];
  }

  // De-duplicate prompts while preserving intent/source metadata.
  const seen = new Set<string>();
  return prompts.filter((prompt) => {
    const key = prompt.promptText.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Persists generated prompts into prompt_library, respecting the unique
 * (project_id, prompt_text) constraint.
 */
export async function syncPromptLibrary(
  supabase: SupabaseClient<Database>,
  projectId: string,
  prompts: GeneratedPrompt[]
): Promise<Array<{ id: string; prompt_text: string }>> {
  if (!prompts || prompts.length === 0) return [];

  const rows = prompts.map((prompt) => ({
    project_id: projectId,
    prompt_text: prompt.promptText,
    category: prompt.intent,
    is_active: true,
  }));

  const { data: upserted, error } = await supabase
    .from('prompt_library')
    .upsert(rows, { onConflict: 'project_id, prompt_text' })
    .select('id, prompt_text');

  if (error) {
    throw new Error(`Failed to sync scan prompts: ${error.message}`);
  }

  if (!upserted || upserted.length === 0) {
    throw new Error('Failed to sync scan prompts: database returned no prompt rows.');
  }

  return upserted;
}
