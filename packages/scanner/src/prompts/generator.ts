import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { BusinessContextFieldRecord } from '../types';

export interface GeneratedPrompt {
  promptText: string;
  intent: 'informational' | 'comparison' | 'transactional' | 'navigational';
  sourceFields: string[];
}

/**
 * Generates natural user search prompts grouped by search intent from project business context fields.
 */
export function generatePromptsFromContext(
  fields: BusinessContextFieldRecord[]
): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];

  const getValues = (name: string) =>
    fields.filter((f) => f.field_name === name).map((f) => f.field_value);

  const companyNames = getValues('companyName');
  const industries = getValues('industry');
  const products = getValues('products');
  const services = getValues('services');
  const locations = getValues('locations');

  const primaryCompany = companyNames[0] || 'the company';
  const primaryIndustry = industries[0] || 'services';
  const primaryLocation = locations[0];

  // 1. Navigational Prompts
  if (companyNames.length > 0) {
    prompts.push({
      promptText: `What is ${primaryCompany} and what services do they provide?`,
      intent: 'navigational',
      sourceFields: ['companyName'],
    });
  }

  // 2. Informational Prompts
  if (industries.length > 0) {
    const locString = primaryLocation ? ` in ${primaryLocation}` : '';
    prompts.push({
      promptText: `What are the best ${primaryIndustry} solutions${locString}?`,
      intent: 'informational',
      sourceFields: primaryLocation ? ['industry', 'locations'] : ['industry'],
    });
  }

  products.slice(0, 2).forEach((prod) => {
    prompts.push({
      promptText: `How does ${prod} work and what are its key features?`,
      intent: 'informational',
      sourceFields: ['products'],
    });
  });

  // 3. Comparison Prompts
  if (products.length > 0 || services.length > 0) {
    const mainOffering = products[0] || services[0];
    prompts.push({
      promptText: `Top alternatives and competitors for ${mainOffering} in 2026`,
      intent: 'comparison',
      sourceFields: products.length > 0 ? ['products'] : ['services'],
    });
  }

  // 4. Transactional Prompts
  if (services.length > 0) {
    prompts.push({
      promptText: `Best ${services[0]} provider for modern companies`,
      intent: 'transactional',
      sourceFields: ['services'],
    });
  }

  return prompts;
}

/**
 * Persists generated prompts into prompt_library table, respecting UNIQUE (project_id, prompt_text) constraint.
 */
export async function syncPromptLibrary(
  supabase: SupabaseClient<Database>,
  projectId: string,
  prompts: GeneratedPrompt[]
): Promise<Array<{ id: string; prompt_text: string }>> {
  if (!prompts || prompts.length === 0) return [];

  const rows = prompts.map((p) => ({
    project_id: projectId,
    prompt_text: p.promptText,
    intent: p.intent,
    source_fields: p.sourceFields,
    is_active: true,
  }));

  // Upsert or insert ignoring duplicates on (project_id, prompt_text)
  const { data: upserted, error } = await supabase
    .from('prompt_library')
    .upsert(rows, { onConflict: 'project_id,prompt_text' })
    .select('id, prompt_text');

  if (error || !upserted) {
    // If upsert fails, fetch existing active prompts for project
    const { data: existing } = await supabase
      .from('prompt_library')
      .select('id, prompt_text')
      .eq('project_id', projectId)
      .eq('is_active', true);

    return existing || [];
  }

  return upserted;
}
