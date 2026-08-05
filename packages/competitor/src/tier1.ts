import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { CompetitorProfile, FrequentlyCitedPage, CoOccurringEntity, ImportantCompetitorPage } from './types';

/**
 * Synchronizes Tier 1 citation matches and entity mentions for a tracked competitor,
 * writing competitor_id back onto citations and aggregating historical competitor_scans rows.
 */
export async function syncCompetitorTier1Data(
  supabase: SupabaseClient<Database>,
  competitorId: string
): Promise<{ updatedCitationsCount: number; scansProcessedCount: number }> {
  // 1. Fetch target competitor record
  const { data: competitor, error: compErr } = await supabase
    .from('competitors')
    .select('id, project_id, name, domain_name')
    .eq('id', competitorId)
    .single();

  if (compErr || !competitor) {
    throw new Error(`Competitor not found: ${competitorId}`);
  }

  const normalizedCompDomain = competitor.domain_name.toLowerCase().replace(/^www\./, '');
  const normalizedCompName = competitor.name.toLowerCase();

  // 2. Fetch active project scans
  const { data: scans, error: scansErr } = await supabase
    .from('scans')
    .select('id, created_at')
    .eq('project_id', competitor.project_id)
    .is('deleted_at', null);

  if (scansErr || !scans || scans.length === 0) {
    return { updatedCitationsCount: 0, scansProcessedCount: 0 };
  }

  const scanIds = scans.map((s) => s.id);

  // 3. Fetch citations for project scans matching competitor domain
  const { data: citations } = await supabase
    .from('citations')
    .select('id, scan_id, source_url, source_domain, citation_order')
    .in('scan_id', scanIds);

  let updatedCitationsCount = 0;
  const matchingCitationIds: string[] = [];

  if (citations) {
    for (const c of citations) {
      const cDomain = c.source_domain.toLowerCase().replace(/^www\./, '');
      if (cDomain === normalizedCompDomain || cDomain.endsWith(`.${normalizedCompDomain}`)) {
        matchingCitationIds.push(c.id);
      }
    }
  }

  if (matchingCitationIds.length > 0) {
    // Update citations.competitor_id
    await supabase
      .from('citations')
      .update({ competitor_id: competitorId })
      .in('id', matchingCitationIds);

    updatedCitationsCount = matchingCitationIds.length;
  }

  // 4. Aggregate into competitor_scans per scan
  let scansProcessedCount = 0;

  for (const scan of scans) {
    const scanCitations = (citations || []).filter((c) => c.scan_id === scan.id);
    const competitorCitations = scanCitations.filter((c) => matchingCitationIds.includes(c.id));

    // Check entity mentions for this scan
    const { data: entityMentions } = await supabase
      .from('entity_mentions')
      .select('id, context_snippet, entities!inner(name)')
      .eq('scan_id', scan.id);

    let entityMatchCount = 0;
    if (entityMentions) {
      for (const em of entityMentions) {
        const entName = Array.isArray(em.entities)
          ? em.entities[0]?.name?.toLowerCase()
          : (em.entities as { name?: string })?.name?.toLowerCase();

        const snippet = em.context_snippet?.toLowerCase() || '';

        if (
          (entName && entName.includes(normalizedCompName)) ||
          snippet.includes(normalizedCompName) ||
          snippet.includes(normalizedCompDomain)
        ) {
          entityMatchCount++;
        }
      }
    }

    const citationMatchCount = competitorCitations.length;
    const mentionCount = citationMatchCount + entityMatchCount;

    let rankPosition: number | null = null;
    if (competitorCitations.length > 0) {
      const orders = competitorCitations
        .map((c) => c.citation_order)
        .filter((o): o is number => o !== null);
      if (orders.length > 0) {
        rankPosition = Math.min(...orders);
      }
    }

    // Compute visibility score (0-100)
    let visScore: number | null = null;
    if (mentionCount > 0) {
      visScore = 50;
      if (rankPosition === 1) visScore += 50;
      else if (rankPosition === 2) visScore += 35;
      else if (rankPosition === 3) visScore += 20;
      else if (rankPosition && rankPosition <= 5) visScore += 10;
    } else {
      visScore = 0;
    }

    // Check if competitor_scan row exists for scan_id and competitor_id
    const { data: existingCompScan } = await supabase
      .from('competitor_scans')
      .select('id')
      .eq('competitor_id', competitorId)
      .eq('scan_id', scan.id)
      .limit(1);

    const firstCompScan = existingCompScan?.[0];
    const existingId = firstCompScan ? firstCompScan.id : null;
    if (existingId) {
      await supabase
        .from('competitor_scans')
        .update({
          visibility_score: visScore,
          mention_count: mentionCount,
          rank_position: rankPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId);
    } else {
      await supabase.from('competitor_scans').insert({
        competitor_id: competitorId,
        scan_id: scan.id,
        visibility_score: visScore,
        mention_count: mentionCount,
        rank_position: rankPosition,
      });
    }

    scansProcessedCount++;
  }

  return { updatedCitationsCount, scansProcessedCount };
}

/**
 * Derives profile information for a competitor including latest derived visibilityScore,
 * citation count, frequently cited pages, first/last seen timestamps, and co-occurring entities.
 */
export async function getCompetitorProfile(
  supabase: SupabaseClient<Database>,
  competitorId: string
): Promise<CompetitorProfile> {
  const { data: comp, error } = await supabase
    .from('competitors')
    .select('id, project_id, name, domain_name, domain_id, created_at')
    .eq('id', competitorId)
    .single();

  if (error || !comp) {
    throw new Error(`Competitor not found: ${competitorId}`);
  }

  // 1. Derive visibilityScore from latest competitor_scans row
  const { data: latestScanRow } = await supabase
    .from('competitor_scans')
    .select('visibility_score, created_at')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false })
    .limit(1);

  const visibilityScore = latestScanRow?.[0]?.visibility_score ?? null;

  // 2. Fetch citations for this competitor
  const { data: citations } = await supabase
    .from('citations')
    .select('id, source_url, created_at')
    .eq('competitor_id', competitorId);

  const citationCount = citations?.length || 0;

  // Group frequently cited pages
  const pageMap = new Map<string, number>();
  let earliestDate: string | null = citations?.[0]?.created_at || null;
  let latestDate: string | null = citations?.[0]?.created_at || null;

  if (citations) {
    for (const c of citations) {
      pageMap.set(c.source_url, (pageMap.get(c.source_url) || 0) + 1);
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

  // 3. Fetch co-occurring entity mentions in scans where this competitor was cited
  const scanIdsForComp = Array.from(
    new Set((citations || []).map((c) => c.id))
  );

  let entities: CoOccurringEntity[] = [];
  if (scanIdsForComp.length > 0) {
    const { data: mentions } = await supabase
      .from('entity_mentions')
      .select('entities!inner(name, entity_type)')
      .in('scan_id', scanIdsForComp);

    if (mentions) {
      const entCounts = new Map<string, { name: string; type: string; count: number }>();
      for (const m of mentions) {
        const entName = Array.isArray(m.entities) ? m.entities[0]?.name : (m.entities as { name?: string })?.name;
        const entType = Array.isArray(m.entities) ? m.entities[0]?.entity_type : (m.entities as { entity_type?: string })?.entity_type;

        if (entName && entName.toLowerCase() !== comp.name.toLowerCase()) {
          const key = entName.toLowerCase();
          const existing = entCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            entCounts.set(key, { name: entName, type: entType || 'general', count: 1 });
          }
        }
      }
      entities = Array.from(entCounts.values()).sort((a, b) => b.count - a.count);
    }
  }

  // 4. Check Tier 2 availability (pages crawled under competitor.domain_id)
  let tier2Available = false;
  let importantPages: ImportantCompetitorPage[] | null = null;
  let topics: string[] | null = null;

  if (comp.domain_id) {
    const { data: pages } = await supabase
      .from('pages')
      .select('id, url, title, http_status, word_count, crawl_status')
      .eq('domain_id', comp.domain_id);

    if (pages && pages.length > 0) {
      const completedPages = pages.filter((p) => p.crawl_status === 'completed' || p.crawl_status === 'scanned');
      if (completedPages.length > 0) {
        tier2Available = true;
        importantPages = completedPages.slice(0, 10).map((p) => ({
          id: p.id,
          url: p.url,
          title: p.title,
          httpStatus: p.http_status,
          wordCount: p.word_count,
        }));

        // Extract topics from page titles
        const topicSet = new Set<string>();
        for (const p of completedPages) {
          if (p.title) {
            const words = p.title
              .split(/[\s|,\-:]+/)
              .map((w) => w.trim())
              .filter((w) => w.length > 3);
            for (const w of words) topicSet.add(w.toLowerCase());
          }
        }
        topics = Array.from(topicSet).slice(0, 15);
      }
    }
  }

  return {
    id: comp.id,
    projectId: comp.project_id,
    companyName: comp.name,
    domain: comp.domain_name,
    domainId: comp.domain_id,
    detectedFrom: 'user_added',
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
