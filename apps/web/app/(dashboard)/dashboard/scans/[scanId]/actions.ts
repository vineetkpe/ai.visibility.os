'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getProjectRecommendations,
  type Recommendation,
} from '@ai-visibility-os/recommendations';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScanDetailsData {
  scan: {
    id: string;
    projectId: string;
    queryPrompt: string;
    aiModel: string;
    status: string;
    visibilityScore: number | null;
    summary: string | null;
    rawResponse: string | null;
    errorMessage: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    durationSeconds: number | null;
  };
  recommendations: Recommendation[];
  aiVisibility: {
    mentionSummary: Array<{
      id: string;
      entityName: string;
      entityType: string;
      snippet: string | null;
      sentiment: string;
    }>;
    citationSummary: {
      totalCount: number;
      ownCount: number;
      externalCount: number;
      topDomains: string[];
    };
    platformBreakdown: Array<{
      provider: string;
      displayName: string;
      isAvailable: boolean;
      score: number | null;
      summary: string | null;
    }>;
  };
  competitorAnalysis: {
    tier1ScanCompetitors: Array<{
      id: string;
      competitorId: string;
      name: string;
      domainName: string;
      visibilityScore: number | null;
      mentionCount: number;
    }>;
    tier2Profiles: Array<{
      id: string;
      name: string;
      domainName: string;
      tier2Crawled: boolean;
    }>;
  };
  websiteDiscovery: {
    totalPages: number;
    schemaCoveragePct: number;
    metadataCoveragePct: number;
    sitemapUrl: string | null;
    sitemapUrlsFound: number | null;
    pagesSkippedRobots: number | null;
  };
  evidence: {
    sourcePages: Array<{
      id: string;
      url: string;
      title: string | null;
      httpStatus: number;
      rankPosition: number | null;
      sentimentScore: number | null;
    }>;
    citations: Array<{
      id: string;
      sourceUrl: string;
      sourceDomain: string;
      anchorText: string | null;
      citationOrder: number;
      isOwnDomain: boolean;
    }>;
    rawResponse: string | null;
  };
}

/**
 * Server Action to fetch complete grounded scan details, evidence, and narrative sections.
 */
export async function getScanDetailsData(
  scanId: string
): Promise<ActionResult<ScanDetailsData>> {
  try {
    const supabase = await createClient();

    // 1. Verify User Authentication
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Fetch Target Scan Record & Verify Ownership
    const { data: scanRow, error: scanErr } = await supabase
      .from('scans')
      .select('id, project_id, prompt_id, query_prompt, ai_model, status, visibility_score, summary, raw_response, error_message, started_at, completed_at, created_at')
      .eq('id', scanId)
      .is('deleted_at', null)
      .maybeSingle();

    if (scanErr || !scanRow) {
      return { success: false, error: 'Scan record not found.' };
    }

    // Check project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', scanRow.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!project) {
      return { success: false, error: 'Project access denied.' };
    }

    // Calculate runtime duration
    let durationSeconds: number | null = null;
    if (scanRow.completed_at) {
      const startTime = scanRow.started_at ? new Date(scanRow.started_at).getTime() : new Date(scanRow.created_at).getTime();
      const endTime = new Date(scanRow.completed_at).getTime();
      durationSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));
    }

    // 3. Fetch Recommendations linked specifically to this scan
    const { data: scanEvidence } = await supabase
      .from('recommendation_evidence')
      .select('recommendation_id')
      .eq('scan_id', scanId);

    const linkedRecIds = new Set<string>();
    (scanEvidence || []).forEach((e) => linkedRecIds.add(e.recommendation_id));

    const allProjectRecs = await getProjectRecommendations(supabase, scanRow.project_id);
    const scanRecommendations = allProjectRecs.filter(
      (r) => r.scanId === scanId || linkedRecIds.has(r.id)
    );

    // 4. Fetch AI Visibility Data (Mentions & Citations for scan)
    const { data: mentionsData } = await supabase
      .from('entity_mentions')
      .select('id, context_snippet, sentiment, entities(name, entity_type)')
      .eq('scan_id', scanId);

    const mentionSummary = (mentionsData || []).map((m) => ({
      id: m.id,
      entityName: ((m.entities as unknown) as { name: string; entity_type: string } | null)?.name || 'Unknown Entity',
      entityType: ((m.entities as unknown) as { name: string; entity_type: string } | null)?.entity_type || 'Brand',
      snippet: m.context_snippet,
      sentiment: m.sentiment || 'neutral',
    }));

    const { data: citationsData } = await supabase
      .from('citations')
      .select('id, source_url, source_domain, anchor_text, citation_order, is_own_domain')
      .eq('scan_id', scanId)
      .order('citation_order', { ascending: true });

    const citationList = citationsData || [];
    const ownCount = citationList.filter((c) => c.is_own_domain).length;
    const externalCount = citationList.length - ownCount;
    const topDomains = Array.from(new Set(citationList.map((c) => c.source_domain)));

    const platformBreakdown = [
      {
        provider: 'google-gemini',
        displayName: 'Google Gemini 3.6 Flash',
        isAvailable: true,
        score: scanRow.visibility_score,
        summary: scanRow.summary,
      },
      {
        provider: 'openai-chatgpt',
        displayName: 'ChatGPT (OpenAI)',
        isAvailable: false,
        score: null,
        summary: null,
      },
      {
        provider: 'anthropic-claude',
        displayName: 'Claude (Anthropic)',
        isAvailable: false,
        score: null,
        summary: null,
      },
      {
        provider: 'perplexity-ai',
        displayName: 'Perplexity AI',
        isAvailable: false,
        score: null,
        summary: null,
      },
    ];

    // 5. Fetch Competitor Data (Tier 1 vs Tier 2)
    // Tier 1: competitor_scans for THIS scan_id
    const { data: tier1Scans } = await supabase
      .from('competitor_scans')
      .select('id, competitor_id, visibility_score, mention_count, competitors(name, domain_name)')
      .eq('scan_id', scanId);

    const tier1ScanCompetitors = (tier1Scans || []).map((cs) => ({
      id: cs.id,
      competitorId: cs.competitor_id,
      name: ((cs.competitors as unknown) as { name: string; domain_name: string } | null)?.name || 'Competitor',
      domainName: ((cs.competitors as unknown) as { name: string; domain_name: string } | null)?.domain_name || '',
      visibilityScore: cs.visibility_score,
      mentionCount: cs.mention_count || 0,
    }));

    // Tier 2: Domain-level tracked competitors for project
    const { data: projectCompetitors } = await supabase
      .from('competitors')
      .select('id, name, domain_name')
      .eq('project_id', scanRow.project_id);

    const { data: compDomains } = (projectCompetitors || []).length > 0
      ? await supabase
          .from('domains')
          .select('id, domain_name, status')
          .eq('project_id', scanRow.project_id)
          .eq('domain_type', 'competitor')
      : { data: [] };

    const crawledCompDomainSet = new Set(
      (compDomains || []).filter((d) => d.status === 'crawled').map((d) => d.domain_name.toLowerCase())
    );

    const tier2Profiles = (projectCompetitors || []).map((c) => ({
      id: c.id,
      name: c.name,
      domainName: c.domain_name,
      tier2Crawled: crawledCompDomainSet.has(c.domain_name.toLowerCase()),
    }));

    // 6. Fetch Website Discovery & Crawl Job Payload
    const { data: projectDomains } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', scanRow.project_id);

    const domainIds = (projectDomains || []).map((d) => d.id);
    const { data: pagesData } = domainIds.length > 0
      ? await supabase
          .from('pages')
          .select('id, url, title, http_status, meta_description, schema_org_types')
          .in('domain_id', domainIds)
      : { data: [] };

    const pageList = pagesData || [];
    const totalPages = pageList.length;
    let schemaCount = 0;
    let metadataCount = 0;

    pageList.forEach((p) => {
      const types = p.schema_org_types as string[] | null;
      if (Array.isArray(types) && types.length > 0) schemaCount++;
      if (p.title?.trim() && p.meta_description?.trim()) metadataCount++;
    });

    const schemaCoveragePct = totalPages > 0 ? Math.round((schemaCount / totalPages) * 100) : 0;
    const metadataCoveragePct = totalPages > 0 ? Math.round((metadataCount / totalPages) * 100) : 0;

    // Crawl Job result payload for sitemap & robots
    const { data: latestCrawlJob } = await supabase
      .from('jobs')
      .select('result')
      .eq('project_id', scanRow.project_id)
      .eq('job_type', 'site_crawl')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const jobResultObj = (latestCrawlJob?.result as Record<string, unknown> | null) || {};
    const sitemapUrl = typeof jobResultObj.sitemap_url === 'string' ? jobResultObj.sitemap_url : null;
    const sitemapUrlsFound = typeof jobResultObj.sitemap_urls_found === 'number' ? jobResultObj.sitemap_urls_found : null;
    const pagesSkippedRobots = typeof jobResultObj.pages_skipped_robots === 'number' ? jobResultObj.pages_skipped_robots : null;

    // 7. Fetch Evidence (Source Pages, Citations, Raw Response)
    const { data: pageScansData } = await supabase
      .from('page_scans')
      .select('id, page_id, rank_position, sentiment_score, pages(url, title, http_status)')
      .eq('scan_id', scanId);

    const sourcePages = (pageScansData || []).map((ps) => ({
      id: ps.id,
      url: ((ps.pages as unknown) as { url: string; title: string | null; http_status: number } | null)?.url || '',
      title: ((ps.pages as unknown) as { url: string; title: string | null; http_status: number } | null)?.title || null,
      httpStatus: ((ps.pages as unknown) as { url: string; title: string | null; http_status: number } | null)?.http_status || 200,
      rankPosition: ps.rank_position,
      sentimentScore: ps.sentiment_score,
    }));

    return {
      success: true,
      data: {
        scan: {
          id: scanRow.id,
          projectId: scanRow.project_id,
          queryPrompt: scanRow.query_prompt,
          aiModel: scanRow.ai_model,
          status: scanRow.status,
          visibilityScore: scanRow.visibility_score,
          summary: scanRow.summary,
          rawResponse: scanRow.raw_response,
          errorMessage: scanRow.error_message,
          startedAt: scanRow.started_at,
          completedAt: scanRow.completed_at,
          createdAt: scanRow.created_at,
          durationSeconds,
        },
        recommendations: scanRecommendations,
        aiVisibility: {
          mentionSummary,
          citationSummary: {
            totalCount: citationList.length,
            ownCount,
            externalCount,
            topDomains,
          },
          platformBreakdown,
        },
        competitorAnalysis: {
          tier1ScanCompetitors,
          tier2Profiles,
        },
        websiteDiscovery: {
          totalPages,
          schemaCoveragePct,
          metadataCoveragePct,
          sitemapUrl,
          sitemapUrlsFound,
          pagesSkippedRobots,
        },
        evidence: {
          sourcePages,
          citations: citationList.map((c) => ({
            id: c.id,
            sourceUrl: c.source_url,
            sourceDomain: c.source_domain,
            anchorText: c.anchor_text,
            citationOrder: c.citation_order ?? 0,
            isOwnDomain: c.is_own_domain,
          })),
          rawResponse: scanRow.raw_response,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch scan details.';
    return { success: false, error: message };
  }
}
