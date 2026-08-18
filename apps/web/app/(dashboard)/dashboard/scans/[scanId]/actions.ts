'use server';

import { createClient } from '@/lib/supabase/server';
import { getProjectRecommendations, type Recommendation } from '@ai-visibility-os/recommendations';

export interface ActionResult<T> { success: boolean; data?: T; error?: string; }
export interface ScanDetailsData {
  scan: { id: string; projectId: string; queryPrompt: string; aiModel: string; status: string; visibilityScore: number | null; summary: string | null; rawResponse: string | null; errorMessage: string | null; startedAt: string | null; completedAt: string | null; createdAt: string; durationSeconds: number | null; };
  recommendations: Recommendation[];
  aiVisibility: { mentionSummary: Array<{ id: string; entityName: string; entityType: string; snippet: string | null; sentiment: string; }>; citationSummary: { totalCount: number; ownCount: number; externalCount: number; topDomains: string[]; }; platformBreakdown: Array<{ provider: string; displayName: string; isAvailable: boolean; score: number | null; summary: string | null; }>; };
  competitorAnalysis: { tier1ScanCompetitors: Array<{ id: string; competitorId: string; name: string; domainName: string; visibilityScore: number | null; mentionCount: number; }>; tier2Profiles: Array<{ id: string; name: string; domainName: string; tier2Crawled: boolean; }>; };
  websiteDiscovery: { totalPages: number; schemaCoveragePct: number; metadataCoveragePct: number; sitemapUrl: string | null; sitemapUrlsFound: number | null; pagesSkippedRobots: number | null; };
  evidence: { sourcePages: Array<{ id: string; url: string; title: string | null; httpStatus: number; rankPosition: number | null; sentimentScore: number | null; }>; citations: Array<{ id: string; sourceUrl: string; sourceDomain: string; anchorText: string | null; citationOrder: number; isOwnDomain: boolean; }>; rawResponse: string | null; };
}

export async function getScanDetailsData(scanId: string): Promise<ActionResult<ScanDetailsData>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return { success: false, error: 'Authentication required. Please sign in.' };

    const { data: scanRow, error: scanErr } = await supabase.from('ai_scans').select('id, project_id, provider_id, prompt_text, model_name, status, is_mentioned, summary_markdown, raw_response, error_message, started_at, completed_at, created_at').eq('id', scanId).maybeSingle();
    if (scanErr || !scanRow) return { success: false, error: 'Scan record not found.' };
    const { data: project } = await supabase.from('projects').select('id, name').eq('id', scanRow.project_id).eq('user_id', user.id).maybeSingle();
    if (!project) return { success: false, error: 'Project access denied.' };

    const durationSeconds = scanRow.completed_at ? Math.max(0, Math.round((new Date(scanRow.completed_at).getTime() - new Date(scanRow.started_at || scanRow.created_at).getTime()) / 1000)) : null;
    const { data: scanEvidence } = await supabase.from('recommendation_evidence').select('recommendation_id').eq('ai_scan_id', scanId);
    const linkedRecIds = new Set((scanEvidence || []).map((e) => e.recommendation_id));
    const allProjectRecs = await getProjectRecommendations(supabase, scanRow.project_id);
    const scanRecommendations = allProjectRecs.filter((r) => r.scanId === scanId || linkedRecIds.has(r.id));

    const { data: citationsData, error: citationError } = await supabase.from('citations').select('id, url, title, position, is_own_domain, competitor_id').eq('ai_scan_id', scanId).order('position', { ascending: true });
    if (citationError) return { success: false, error: citationError.message };
    const citationList = citationsData || [];
    const ownCount = citationList.filter((c) => c.is_own_domain).length;
    const topDomains = Array.from(new Set(citationList.map((c) => { try { return c.url ? new URL(c.url).hostname : ''; } catch { return ''; } }).filter(Boolean)));

    const { data: mentionRows, error: mentionError } = await supabase.from('entity_mentions').select('id, context_snippet, sentiment, tracked_entities(name, entity_type)').eq('ai_scan_id', scanId).order('created_at', { ascending: true });
    if (mentionError) return { success: false, error: mentionError.message };
    const mentionSummary = (mentionRows || []).map((m) => { const entity = Array.isArray(m.tracked_entities) ? m.tracked_entities[0] : m.tracked_entities; return { id: m.id, entityName: entity?.name || 'Unknown entity', entityType: entity?.entity_type || 'other', snippet: m.context_snippet, sentiment: m.sentiment || 'neutral' }; });

    const { data: providers } = await supabase.from('providers').select('id, slug, display_name, is_active');
    const { data: providerScans } = await supabase.from('ai_scans').select('provider_id, is_mentioned, status, summary_markdown').eq('project_id', scanRow.project_id).eq('status', 'completed');
    const platformBreakdown = (providers || []).map((p) => { const scans = (providerScans || []).filter((s) => s.provider_id === p.id); const mentioned = scans.filter((s) => s.is_mentioned).length; return { provider: p.slug, displayName: p.display_name, isAvailable: p.is_active, score: scans.length ? Math.round((mentioned / scans.length) * 100) : null, summary: p.id === scanRow.provider_id ? scanRow.summary_markdown : null }; });

    const { data: projectCompetitors } = await supabase.from('competitors').select('id, name, domain_id, status, domains!inner(host)').eq('project_id', scanRow.project_id).eq('status', 'confirmed');
    const confirmedList = projectCompetitors || [];
    const tier1ScanCompetitors = confirmedList.map((c) => { const host = c.domains?.host || ''; const citedRows = citationList.filter((cit) => cit.competitor_id === c.id); return { id: c.id, competitorId: c.id, name: c.name, domainName: host, visibilityScore: citationList.length ? Math.round((citedRows.length / citationList.length) * 100) : 0, mentionCount: citedRows.length }; });
    const competitorDomainIds = confirmedList.map((c) => c.domain_id);
    const { data: competitorPages } = competitorDomainIds.length ? await supabase.from('pages').select('domain_id').in('domain_id', competitorDomainIds) : { data: [] };
    const crawledDomainIds = new Set((competitorPages || []).map((p) => p.domain_id));
    const tier2Profiles = confirmedList.map((c) => ({ id: c.id, name: c.name, domainName: c.domains?.host || '', tier2Crawled: crawledDomainIds.has(c.domain_id) }));

    const { data: projectDomains } = await supabase.from('domains').select('id, is_primary').eq('project_id', scanRow.project_id);
    const domainIds = (projectDomains || []).map((d) => d.id);
    const { data: pagesData } = domainIds.length ? await supabase.from('pages').select('id, url, status_code, page_metadata(title, meta_description, schema_json)').in('domain_id', domainIds) : { data: [] };
    const pageList = pagesData || [];
    let schemaCount = 0; let metadataCount = 0;
    for (const page of pageList) { const meta = Array.isArray(page.page_metadata) ? page.page_metadata[0] : page.page_metadata; if (meta?.schema_json) schemaCount++; if (meta?.title?.trim() && meta?.meta_description?.trim()) metadataCount++; }

    const { data: latestCrawlJob } = await supabase.from('jobs').select('progress').eq('project_id', scanRow.project_id).eq('job_type', 'site_crawl').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const crawlProgress = latestCrawlJob?.progress as { sitemap_url?: string | null; sitemap_urls_found?: number | null; pages_skipped_robots?: number | null } | null;
    const primaryDomainId = (projectDomains || []).find((d) => d.is_primary)?.id || domainIds[0];
    const { data: sitemap } = primaryDomainId ? await supabase.from('sitemaps').select('url, url_count').eq('domain_id', primaryDomainId).order('updated_at', { ascending: false }).limit(1).maybeSingle() : { data: null };

    const sourcePages = pageList.map((p) => { const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata; return { id: p.id, url: p.url, title: meta?.title || null, httpStatus: p.status_code || 0, rankPosition: null, sentimentScore: null }; });
    const formattedCitations = citationList.map((c) => { let host = ''; try { host = c.url ? new URL(c.url).hostname : ''; } catch { /* ignore */ } return { id: c.id, sourceUrl: c.url, sourceDomain: host, anchorText: c.title, citationOrder: c.position ?? 0, isOwnDomain: c.is_own_domain }; });

    return { success: true, data: {
      scan: { id: scanRow.id, projectId: scanRow.project_id, queryPrompt: scanRow.prompt_text, aiModel: scanRow.model_name || 'Configured provider', status: scanRow.status, visibilityScore: scanRow.status === 'completed' ? (scanRow.is_mentioned ? 100 : 0) : null, summary: scanRow.summary_markdown, rawResponse: scanRow.raw_response, errorMessage: scanRow.error_message, startedAt: scanRow.started_at, completedAt: scanRow.completed_at, createdAt: scanRow.created_at, durationSeconds },
      recommendations: scanRecommendations,
      aiVisibility: { mentionSummary, citationSummary: { totalCount: citationList.length, ownCount, externalCount: citationList.length - ownCount, topDomains }, platformBreakdown },
      competitorAnalysis: { tier1ScanCompetitors, tier2Profiles },
      websiteDiscovery: { totalPages: pageList.length, schemaCoveragePct: pageList.length ? Math.round((schemaCount / pageList.length) * 100) : 0, metadataCoveragePct: pageList.length ? Math.round((metadataCount / pageList.length) * 100) : 0, sitemapUrl: sitemap?.url || crawlProgress?.sitemap_url || null, sitemapUrlsFound: sitemap?.url_count ?? crawlProgress?.sitemap_urls_found ?? null, pagesSkippedRobots: crawlProgress?.pages_skipped_robots ?? null },
      evidence: { sourcePages, citations: formattedCitations, rawResponse: scanRow.raw_response },
    } };
  } catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch scan details.' }; }
}
