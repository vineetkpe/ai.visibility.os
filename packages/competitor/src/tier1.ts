import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  CompetitorProfile,
  FrequentlyCitedPage,
  CoOccurringEntity,
  ImportantCompetitorPage,
  CompetitorStatus,
  CompetitorSource,
} from './types';

/**
 * Synchronizes Tier 1 citation matches for a confirmed tracked competitor,
 * linking competitor_id on citations matching the competitor domain host.
 */
export async function syncCompetitorTier1Data(
  supabase: SupabaseClient<Database>,
  competitorId: string
): Promise<{ updatedCitationsCount: number; scansProcessedCount: number }> {
  // 1. Fetch target competitor record joined with domain
  const { data: competitor, error: compErr } = await supabase
    .from('competitors')
    .select('id, project_id, name, domain_id, domains!inner(host)')
    .eq('id', competitorId)
    .single();

  if (compErr || !competitor) {
    throw new Error(`Competitor not found: ${competitorId}`);
  }

  const domainHost = (competitor.domains as unknown as { host: string }).host;
  const normalizedCompDomain = domainHost.toLowerCase().replace(/^www\./, '');

  // 2. Fetch active project scans
  const { data: scans, error: scansErr } = await supabase
    .from('ai_scans')
    .select('id, created_at')
    .eq('project_id', competitor.project_id);

  if (scansErr || !scans || scans.length === 0) {
    return { updatedCitationsCount: 0, scansProcessedCount: 0 };
  }

  const scanIds = scans.map((s) => s.id);

  // 3. Fetch unlinked non-own citations for project scans
  const { data: citations } = await supabase
    .from('citations')
    .select('id, ai_scan_id, url')
    .in('ai_scan_id', scanIds)
    .eq('is_own_domain', false)
    .is('competitor_id', null);

  const matchingCitationIds: string[] = [];

  if (citations) {
    for (const c of citations) {
      try {
        const parsedUrl = new URL(c.url);
        const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
        if (host === normalizedCompDomain || host.endsWith(`.${normalizedCompDomain}`)) {
          matchingCitationIds.push(c.id);
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  }

  if (matchingCitationIds.length > 0) {
    await supabase
      .from('citations')
      .update({ competitor_id: competitorId })
      .in('id', matchingCitationIds);
  }

  return {
    updatedCitationsCount: matchingCitationIds.length,
    scansProcessedCount: scans.length,
  };
}

/**
 * Derives profile information for a competitor including calculated visibilityScore,
 * citation count, frequently cited pages, first/last seen timestamps, and co-occurring entities.
 */
export async function getCompetitorProfile(
  supabase: SupabaseClient<Database>,
  competitorId: string
): Promise<CompetitorProfile> {
  const { data: comp, error } = await supabase
    .from('competitors')
    .select('id, project_id, name, source, status, confirmed_at, domain_id, created_at, domains!inner(host)')
    .eq('id', competitorId)
    .single();

  if (error || !comp) {
    throw new Error(`Competitor not found: ${competitorId}`);
  }

  const domainHost = (comp.domains as unknown as { host: string }).host;

  // 1. Fetch citations linked to this competitor
  const { data: citations } = await supabase
    .from('citations')
    .select('id, ai_scan_id, url, position, created_at')
    .eq('competitor_id', competitorId);

  const citationCount = citations?.length || 0;

  // 2. Fetch project scans count for visibility score derivation
  const { count: totalScansCount } = await supabase
    .from('ai_scans')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', comp.project_id)
    .eq('status', 'completed');

  // Derive visibility score (0 to 100) dynamically from citations & position
  let visibilityScore: number | null = null;
  if (totalScansCount && totalScansCount > 0 && citations && citations.length > 0) {
    const uniqueScansCited = new Set(citations.map((c) => c.ai_scan_id)).size;
    const minPosition = Math.min(...citations.map((c) => c.position));
    
    let baseScore = Math.round((uniqueScansCited / totalScansCount) * 70);
    if (minPosition === 1) baseScore += 30;
    else if (minPosition <= 3) baseScore += 20;
    else if (minPosition <= 5) baseScore += 10;
    
    visibilityScore = Math.min(100, Math.max(0, baseScore));
  } else if (totalScansCount && totalScansCount > 0) {
    visibilityScore = 0;
  }

  // 3. Aggregate frequently cited pages
  const pageMap = new Map<string, number>();
  let earliestDate: string | null = citations?.[0]?.created_at || null;
  let latestDate: string | null = citations?.[0]?.created_at || null;

  if (citations) {
    for (const c of citations) {
      pageMap.set(c.url, (pageMap.get(c.url) || 0) + 1);
      if (!earliestDate || new Date(c.created_at) < new Date(earliestDate)) {
        earliestDate = c.created_at;
      }
      if (!latestDate || new Date(c.created_at) > new Date(latestDate)) {
        latestDate = c.created_at;
      }
    }
  }

  const frequentlyCitedPages: FrequentlyCitedPage[] = Array.from(pageMap.entries())
    .map(([sourceUrl, count]) => ({ sourceUrl, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Fetch co-occurring entities from scans where competitor was cited
  const scanIdsForComp = Array.from(new Set((citations || []).map((c) => c.ai_scan_id)));

  let entities: CoOccurringEntity[] = [];
  if (scanIdsForComp.length > 0) {
    const { data: mentions } = await supabase
      .from('entity_mentions')
      .select('tracked_entities!inner(name, entity_type)')
      .in('ai_scan_id', scanIdsForComp);

    if (mentions) {
      const entCounts = new Map<string, { name: string; type: string; count: number }>();
      for (const m of mentions) {
        const entObj = (m.tracked_entities as unknown as { name: string; entity_type: string }) || {};
        const entName = entObj.name;
        const entType = entObj.entity_type;

        if (entName && entName.toLowerCase() !== comp.name.toLowerCase()) {
          const key = entName.toLowerCase();
          const existing = entCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            entCounts.set(key, { name: entName, type: entType || 'other', count: 1 });
          }
        }
      }
      entities = Array.from(entCounts.values()).sort((a, b) => b.count - a.count);
    }
  }

  // 5. Check Tier 2 availability (pages under competitor.domain_id)
  let tier2Available = false;
  let importantPages: ImportantCompetitorPage[] | null = null;
  let topics: string[] | null = null;

  if (comp.domain_id) {
    const { data: pages } = await supabase
      .from('pages')
      .select(`
        id,
        url,
        status_code,
        page_metadata (
          title,
          meta_description
        )
      `)
      .eq('domain_id', comp.domain_id);

    if (pages && pages.length > 0) {
      tier2Available = true;
      importantPages = pages.slice(0, 10).map((p) => {
        const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
        return {
          id: p.id,
          url: p.url,
          title: meta?.title || null,
          statusCode: p.status_code,
        };
      });

      const topicSet = new Set<string>();
      for (const p of pages) {
        const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
        if (meta?.title) {
          const words = meta.title
            .split(/[\s|,\-:]+/)
            .map((w: string) => w.trim())
            .filter((w: string) => w.length > 3);
          for (const w of words) topicSet.add(w.toLowerCase());
        }
      }
      topics = Array.from(topicSet).slice(0, 15);
    }
  }

  return {
    id: comp.id,
    projectId: comp.project_id,
    companyName: comp.name,
    domain: domainHost,
    domainId: comp.domain_id,
    source: comp.source as CompetitorSource,
    status: comp.status as CompetitorStatus,
    confirmedAt: comp.confirmed_at,
    firstSeen: earliestDate || comp.created_at,
    lastSeen: latestDate || comp.created_at,
    visibilityScore,
    citationCount,
    frequentlyCitedPages,
    tier2Available,
    importantPages,
    topics,
    entities,
    createdAt: comp.created_at,
  };
}
