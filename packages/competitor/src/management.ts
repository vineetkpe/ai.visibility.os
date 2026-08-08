import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { extractDomainName } from '@ai-visibility-os/shared';
import { syncCompetitorTier1Data, getCompetitorProfile } from './tier1';
import type { CompetitorProfile } from './types';

export interface AddCompetitorOptions {
  projectId: string;
  name: string;
  websiteUrl: string;
}

export interface ConfirmSuggestionOptions {
  projectId: string;
  name: string;
  domain: string;
}

export interface TriggerCrawlOptions {
  projectId: string;
  competitorId: string;
}

/**
 * Manually adds a user-confirmed competitor, normalized using extractDomainName logic.
 * Deduplicates by domain name within the project and runs initial Tier 1 sync.
 */
export async function addCompetitor(
  supabase: SupabaseClient<Database>,
  options: AddCompetitorOptions
): Promise<CompetitorProfile> {
  const { projectId, name, websiteUrl } = options;

  let domainName: string;
  try {
    const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    domainName = extractDomainName(formattedUrl);
  } catch {
    throw new Error('Invalid competitor domain or URL provided.');
  }

  // Deduplicate against existing competitors in project
  const { data: existing } = await supabase
    .from('competitors')
    .select('id, name, domain_name')
    .eq('project_id', projectId)
    .eq('domain_name', domainName)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error(`Competitor with domain '${domainName}' is already tracked in this project.`);
  }

  // Insert new competitor
  const { data: competitor, error: insertErr } = await supabase
    .from('competitors')
    .insert({
      project_id: projectId,
      name: name.trim(),
      domain_name: domainName,
    })
    .select('id')
    .single();

  if (insertErr || !competitor) {
    throw new Error(insertErr?.message || 'Failed to insert competitor.');
  }

  // Synchronize Tier 1 citation & mention evidence
  await syncCompetitorTier1Data(supabase, competitor.id);

  // Return full competitor profile
  return getCompetitorProfile(supabase, competitor.id);
}

/**
 * Confirms a competitor suggestion presented with scan evidence, turning it into a tracked competitor.
 */
export async function confirmCompetitorSuggestion(
  supabase: SupabaseClient<Database>,
  options: ConfirmSuggestionOptions
): Promise<CompetitorProfile> {
  const { projectId, name, domain } = options;
  return addCompetitor(supabase, {
    projectId,
    name,
    websiteUrl: `https://${domain}`,
  });
}

/**
 * Opt-in action to trigger website discovery crawl for a competitor domain (Tier 2).
 * Reuses the existing siteCrawlTask Trigger.dev task and populates pages/page_links identically.
 */
export async function triggerCompetitorCrawl(
  supabase: SupabaseClient<Database>,
  options: TriggerCrawlOptions
): Promise<{ success: boolean; jobId?: string; domainId?: string; error?: string }> {
  const { projectId, competitorId } = options;

  // 1. Fetch competitor
  const { data: competitor, error: compErr } = await supabase
    .from('competitors')
    .select('id, project_id, name, domain_name, domain_id')
    .eq('id', competitorId)
    .eq('project_id', projectId)
    .single();

  if (compErr || !competitor) {
    throw new Error('Competitor record not found or access denied.');
  }

  let domainId = competitor.domain_id;

  // 2. Ensure a domains record exists with domain_type = 'competitor'
  if (!domainId) {
    // Check if domain record already exists
    const { data: existingDomain } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId)
      .eq('host', competitor.domain_name)
      .eq('is_primary', false)
      .is('deleted_at', null)
      .limit(1);

    const firstDomain = existingDomain?.[0];
    const foundDomainId = firstDomain ? firstDomain.id : null;
    if (foundDomainId) {
      domainId = foundDomainId;
    } else {
      const { data: newDomain, error: domainInsertErr } = await supabase
        .from('domains')
        .insert({
          project_id: projectId,
          host: competitor.domain_name,
          is_primary: false,
        })
        .select('id')
        .single();

      if (domainInsertErr || !newDomain) {
        throw new Error(
          domainInsertErr?.message || 'Failed to create domain record for competitor.'
        );
      }
      domainId = newDomain.id;
    }

    // Link domain_id on competitor record
    await supabase
      .from('competitors')
      .update({ domain_id: domainId, updated_at: new Date().toISOString() })
      .eq('id', competitorId);
  }

  // 3. Create site_crawl job record
  const { data: job, error: jobInsertErr } = await supabase
    .from('jobs')
    .insert({
      project_id: projectId,
      job_type: 'site_crawl',
      status: 'pending',
      payload: {
        domain_id: domainId,
        domain_name: competitor.domain_name,
        competitor_id: competitorId,
      },
    })
    .select('id')
    .single();

  if (jobInsertErr || !job) {
    throw new Error(jobInsertErr?.message || 'Failed to create crawl job for competitor.');
  }

  // 4. Trigger existing Trigger.dev crawl task (unchanged)
  try {
    const { siteCrawlTask } = await import('@ai-visibility-os/jobs');
    const handle = await siteCrawlTask.trigger({
      domainId,
      domainName: competitor.domain_name,
      jobId: job.id,
    });
    await supabase.from('jobs').update({ trigger_run_id: handle.id }).eq('id', job.id);
  } catch (triggerErr: unknown) {
    const message = triggerErr instanceof Error ? triggerErr.message : String(triggerErr);
    const errorMessage = `Failed to start background job: ${message}`;
    console.warn('Trigger.dev dispatch warning for competitor crawl:', triggerErr);
    await supabase
      .from('jobs')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', job.id);
    return { success: false, error: errorMessage };
  }

  return {
    success: true,
    jobId: job.id,
    domainId,
  };
}
