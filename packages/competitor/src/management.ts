import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { extractDomainName } from '@ai-visibility-os/shared';
import { syncCompetitorTier1Data, getCompetitorProfile } from './tier1';
import type { CompetitorProfile, CompetitiveVisibilityComparison, ConfirmedCompetitorVisibilitySummary } from './types';

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
 * Ensures a domain record exists with domain_type = 'competitor' and status = 'confirmed'.
 */
export async function addCompetitor(
  supabase: SupabaseClient<Database>,
  options: AddCompetitorOptions
): Promise<CompetitorProfile> {
  const { projectId, name, websiteUrl } = options;

  let domainHost: string;
  try {
    const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    domainHost = extractDomainName(formattedUrl);
  } catch {
    throw new Error('Invalid competitor domain or URL provided.');
  }

  const normalizedHost = domainHost.toLowerCase().replace(/^www\./, '');

  // 1. Ensure a domain record exists in domains table with domain_type = 'competitor'
  const { data: existingDomains } = await supabase
    .from('domains')
    .select('id, host')
    .eq('project_id', projectId)
    .eq('domain_type', 'competitor');

  let competitorDomainId: string | null = null;
  if (existingDomains) {
    for (const d of existingDomains) {
      if (d.host.toLowerCase().replace(/^www\./, '') === normalizedHost) {
        competitorDomainId = d.id;
        break;
      }
    }
  }

  if (!competitorDomainId) {
    const { data: newDomain, error: domainErr } = await supabase
      .from('domains')
      .insert({
        project_id: projectId,
        host: normalizedHost,
        is_primary: false,
        domain_type: 'competitor',
      })
      .select('id')
      .single();

    if (domainErr || !newDomain) {
      throw new Error(domainErr?.message || 'Failed to create competitor domain record.');
    }
    competitorDomainId = newDomain.id;
  }

  // 2. Check if competitor record already exists in competitors table
  const { data: existingComp } = await supabase
    .from('competitors')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('domain_id', competitorDomainId)
    .limit(1)
    .maybeSingle();

  let competitorId: string;
  const now = new Date().toISOString();

  if (existingComp) {
    // Update status to confirmed if it was suggested or dismissed
    await supabase
      .from('competitors')
      .update({
        status: 'confirmed',
        confirmed_at: now,
        updated_at: now,
      })
      .eq('id', existingComp.id);

    competitorId = existingComp.id;
  } else {
    // Insert new confirmed competitor
    const { data: newComp, error: compErr } = await supabase
      .from('competitors')
      .insert({
        project_id: projectId,
        domain_id: competitorDomainId,
        name: name.trim(),
        source: 'user_added',
        status: 'confirmed',
        confirmed_at: now,
      })
      .select('id')
      .single();

    if (compErr || !newComp) {
      throw new Error(compErr?.message || 'Failed to insert competitor record.');
    }

    competitorId = newComp.id;
  }

  // 3. Synchronize Tier 1 citation matches
  await syncCompetitorTier1Data(supabase, competitorId);

  // 4. Return full competitor profile
  return getCompetitorProfile(supabase, competitorId);
}

/**
 * Confirms a competitor suggestion presented with scan evidence, turning it into a tracked confirmed competitor.
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
 * Calculates side-by-side visibility comparison for a project's own domain vs. confirmed competitors.
 * Suggested and dismissed competitors are excluded from calculations.
 */
export async function getCompetitiveVisibilityComparison(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<CompetitiveVisibilityComparison> {
  // 1. Fetch own primary domain
  const { data: ownDomains } = await supabase
    .from('domains')
    .select('id, host')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .limit(1);

  const ownDomainHost = ownDomains?.[0]?.host || 'own-domain.com';

  // 2. Fetch project completed scans count
  const { data: scans } = await supabase
    .from('ai_scans')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'completed');

  const totalScansCount = scans?.length || 0;
  const scanIds = (scans || []).map((s) => s.id);

  // 3. Fetch own-domain citations count & calculate visibility
  let ownCitationsCount = 0;
  let ownDomainVisibilityScore = 0;

  if (scanIds.length > 0) {
    const { data: ownCitations } = await supabase
      .from('citations')
      .select('id, ai_scan_id, position')
      .in('ai_scan_id', scanIds)
      .eq('is_own_domain', true);

    ownCitationsCount = ownCitations?.length || 0;
    if (totalScansCount > 0 && ownCitations && ownCitations.length > 0) {
      const uniqueScans = new Set(ownCitations.map((c) => c.ai_scan_id)).size;
      const minPos = Math.min(...ownCitations.map((c) => c.position));
      let score = Math.round((uniqueScans / totalScansCount) * 70);
      if (minPos === 1) score += 30;
      else if (minPos <= 3) score += 20;
      else if (minPos <= 5) score += 10;
      ownDomainVisibilityScore = Math.min(100, score);
    }
  }

  // 4. Fetch ONLY CONFIRMED competitors for this project
  const { data: confirmedComps } = await supabase
    .from('competitors')
    .select('id, name, status, domains!inner(host)')
    .eq('project_id', projectId)
    .eq('status', 'confirmed');

  const confirmedCompetitors: ConfirmedCompetitorVisibilitySummary[] = [];

  if (confirmedComps && scanIds.length > 0) {
    for (const comp of confirmedComps) {
      const compHost = (comp.domains as unknown as { host: string }).host;

      const { data: compCitations } = await supabase
        .from('citations')
        .select('id, ai_scan_id, position')
        .in('ai_scan_id', scanIds)
        .eq('competitor_id', comp.id);

      const citationsCount = compCitations?.length || 0;
      let compVisScore = 0;

      if (totalScansCount > 0 && compCitations && compCitations.length > 0) {
        const uniqueScans = new Set(compCitations.map((c) => c.ai_scan_id)).size;
        const minPos = Math.min(...compCitations.map((c) => c.position));
        let score = Math.round((uniqueScans / totalScansCount) * 70);
        if (minPos === 1) score += 30;
        else if (minPos <= 3) score += 20;
        else if (minPos <= 5) score += 10;
        compVisScore = Math.min(100, score);
      }

      confirmedCompetitors.push({
        competitorId: comp.id,
        name: comp.name,
        domainHost: compHost,
        citationsCount,
        visibilityScore: compVisScore,
      });
    }
  }

  return {
    projectId,
    ownDomainHost,
    ownDomainCitationsCount: ownCitationsCount,
    ownDomainVisibilityScore,
    confirmedCompetitors,
  };
}

/**
 * Opt-in action to trigger website discovery crawl for a competitor domain (Tier 2).
 * Reuses the existing siteCrawlTask Trigger.dev task.
 */
export async function triggerCompetitorCrawl(
  supabase: SupabaseClient<Database>,
  options: TriggerCrawlOptions
): Promise<{ success: boolean; jobId?: string; domainId?: string; error?: string }> {
  const { projectId, competitorId } = options;

  // Fetch confirmed competitor
  const { data: competitor, error: compErr } = await supabase
    .from('competitors')
    .select('id, project_id, name, domain_id, domains!inner(host)')
    .eq('id', competitorId)
    .eq('project_id', projectId)
    .single();

  if (compErr || !competitor) {
    throw new Error('Competitor record not found or access denied.');
  }

  const domainHost = (competitor.domains as unknown as { host: string }).host;
  const domainId = competitor.domain_id;

  // Create site_crawl job record
  const { data: job, error: jobInsertErr } = await supabase
    .from('jobs')
    .insert({
      project_id: projectId,
      job_type: 'site_crawl',
      status: 'queued',
      resource_type: 'competitor',
      resource_id: competitorId,
      progress: {
        domain_id: domainId,
        domain_name: domainHost,
        competitor_id: competitorId,
      },
    })
    .select('id')
    .single();

  if (jobInsertErr || !job) {
    throw new Error(jobInsertErr?.message || 'Failed to create crawl job for competitor.');
  }

  return {
    success: true,
    jobId: job.id,
    domainId,
  };
}
