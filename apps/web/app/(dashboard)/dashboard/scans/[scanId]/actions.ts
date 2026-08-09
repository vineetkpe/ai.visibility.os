'use server';

import { createClient } from '@/lib/supabase/server';
import { getProjectRecommendations, type Recommendation } from '@ai-visibility-os/recommendations';

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
 * Server Action to fetch complete scan details, evidence, and recommendations using CURRENT schema.
 */
export async function getScanDetailsData(scanId: string): Promise<ActionResult<ScanDetailsData>> {
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
      .from('ai_scans')
      .select(
        'id, project_id, prompt_library_id, prompt_text, model_name, status, is_mentioned, summary_markdown, raw_response, error_message, started_at, completed_at, created_at'
      )
      .eq('id', scanId)
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
      .maybeSingle();

    if (!project) {
      return { success: false, error: 'Project access denied.' };
    }

    // Calculate runtime duration
    let durationSeconds: number | null = null;
    if (scanRow.completed_at) {
      const startTime = scanRow.started_at
        ? new Date(scanRow.started_at).getTime()
        : new Date(scanRow.created_at).getTime();
      const endTime = new Date(scanRow.completed_at).getTime();
      durationSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));
    }

    // 3. Fetch Recommendations linked specifically to this scan
    const { data: scanEvidence } = await supabase
      .from('recommendation_evidence')
      .select('recommendation_id')
      .eq('ai_scan_id', scanId);

    const linkedRecIds = new Set<string>();
    (scanEvidence || []).forEach((e) => linkedRecIds.add(e.recommendation_id));

    const allProjectRecs = await getProjectRecommendations(supabase, scanRow.project_id);
    const scanRecommendations = allProjectRecs.filter(
      (r) => r.scanId === scanId || linkedRecIds.has(r.id)
    );

    // 4. Fetch Citations for scan
    const { data: citationsData } = await supabase
      .from('citations')
      .select('id, url, title, position, is_own_domain, competitor_id')
      .eq('ai_scan_id', scanId)
      .order('position', { ascending: true });

    const citationList = citationsData || [];
    const ownCount = citationList.filter((c) => c.is_own_domain).length;
    const externalCount = citationList.length - ownCount;

    const topDomains = Array.from(
      new Set(
        citationList
          .map((c) => {
            try {
              return c.url ? new URL(c.url).hostname : '';
            } catch {
              return '';
            }
          })
          .filter(Boolean)
      )
    );

    const platformBreakdown = [
      {
        provider: 'google-gemini',
        displayName: 'Google Gemini 3.6 Flash',
        isAvailable: true,
        score: scanRow.status === 'completed' ? (scanRow.is_mentioned ? 100 : 0) : null,
        summary: scanRow.summary_markdown,
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

    // 5. Fetch Confirmed Competitors for project & check citations in this scan
    const { data: projectCompetitors } = await supabase
      .from('competitors')
      .select('id, name, domain_id, status, domains!inner(host)')
      .eq('project_id', scanRow.project_id)
      .eq('status', 'confirmed');

    const confirmedList = projectCompetitors || [];

    const tier1ScanCompetitors = confirmedList.map((c) => {
      const host = c.domains?.host || '';
      const citedInScan = citationList.some((cit) => cit.competitor_id === c.id);
      return {
        id: c.id,
        competitorId: c.id,
        name: c.name,
        domainName: host,
        visibilityScore: citedInScan ? 100 : 0,
        mentionCount: citedInScan ? 1 : 0,
      };
    });

    const tier2Profiles = confirmedList.map((c) => ({
      id: c.id,
      name: c.name,
      domainName: c.domains?.host || '',
      tier2Crawled: false,
    }));

    // 6. Fetch Website Discovery & Crawl Job Payload
    const { data: projectDomains } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', scanRow.project_id);

    const domainIds = (projectDomains || []).map((d) => d.id);
    const { data: pagesData } =
      domainIds.length > 0
        ? await supabase
            .from('pages')
            .select('id, url, status_code, page_metadata(title, meta_description, schema_json)')
            .in('domain_id', domainIds)
        : { data: [] };

    const pageList = pagesData || [];
    const totalPages = pageList.length;
    let schemaCount = 0;
    let metadataCount = 0;

    pageList.forEach((p) => {
      const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
      if (meta) {
        if (meta.schema_json) schemaCount++;
        if (meta.title?.trim() && meta.meta_description?.trim()) metadataCount++;
      }
    });

    const schemaCoveragePct = totalPages > 0 ? Math.round((schemaCount / totalPages) * 100) : 0;
    const metadataCoveragePct = totalPages > 0 ? Math.round((metadataCount / totalPages) * 100) : 0;

    const sitemapUrl: string | null = null;
    const sitemapUrlsFound: number | null = null;
    const pagesSkippedRobots: number | null = null;

    // 7. Evidence: Crawled source pages
    const sourcePages = pageList.map((p) => {
      const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
      return {
        id: p.id,
        url: p.url,
        title: meta?.title || null,
        httpStatus: p.status_code || 200,
        rankPosition: null,
        sentimentScore: null,
      };
    });

    const formattedCitations = citationList.map((c) => {
      let host = '';
      try {
        if (c.url) host = new URL(c.url).hostname;
      } catch {
        host = '';
      }
      return {
        id: c.id,
        sourceUrl: c.url,
        sourceDomain: host,
        anchorText: c.title,
        citationOrder: c.position ?? 0,
        isOwnDomain: c.is_own_domain,
      };
    });

    return {
      success: true,
      data: {
        scan: {
          id: scanRow.id,
          projectId: scanRow.project_id,
          queryPrompt: scanRow.prompt_text,
          aiModel: scanRow.model_name || 'Gemini',
          status: scanRow.status,
          visibilityScore: scanRow.status === 'completed' ? (scanRow.is_mentioned ? 100 : 0) : null,
          summary: scanRow.summary_markdown,
          rawResponse: scanRow.raw_response,
          errorMessage: scanRow.error_message,
          startedAt: scanRow.started_at,
          completedAt: scanRow.completed_at,
          createdAt: scanRow.created_at,
          durationSeconds,
        },
        recommendations: scanRecommendations,
        aiVisibility: {
          mentionSummary: [],
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
          citations: formattedCitations,
          rawResponse: scanRow.raw_response,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch scan details.';
    return { success: false, error: message };
  }
}
