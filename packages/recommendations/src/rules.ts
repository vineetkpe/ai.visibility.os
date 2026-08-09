import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { DetectedIssue, EvidenceRef } from './types';
import { computeImpactScore, determinePriority } from './formula';

/**
 * Deterministic Issue Detection Engine.
 * Evaluates real project evidence (crawled pages, page_metadata, AI scans, citations, confirmed competitors)
 * to detect actionable optimization issues without fabricating data or using legacy columns.
 */
export async function detectProjectIssues(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<DetectedIssue[]> {
  const issues: DetectedIssue[] = [];

  // 1. Fetch Project Primary Domains
  const { data: ownDomains } = await supabase
    .from('domains')
    .select('id, host')
    .eq('project_id', projectId)
    .eq('is_primary', true);

  const ownDomainIds = (ownDomains || []).map((d) => d.id);

  // 2. Fetch Crawled Pages for Primary Domains
  const { data: ownPages } =
    ownDomainIds.length > 0
      ? await supabase
          .from('pages')
          .select('id, url, status_code, domain_id')
          .in('domain_id', ownDomainIds)
      : { data: [] };

  const pagesList = ownPages || [];
  const pageIds = pagesList.map((p) => p.id);

  // 3. Fetch Page Metadata for Crawled Pages
  const { data: metaRows } =
    pageIds.length > 0
      ? await supabase
          .from('page_metadata')
          .select('page_id, title, meta_description, schema_json')
          .in('page_id', pageIds)
      : { data: [] };

  const metaMap = new Map((metaRows || []).map((m) => [m.page_id, m]));

  // 4. Fetch Completed AI Scans for Project
  const { data: completedScans } = await supabase
    .from('ai_scans')
    .select('id, prompt_text, model_name, is_mentioned, created_at')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  const scanList = completedScans || [];
  const scanIds = scanList.map((s) => s.id);

  // 5. Fetch Citations for Completed Scans
  const { data: scanCitations } =
    scanIds.length > 0
      ? await supabase
          .from('citations')
          .select('id, ai_scan_id, url, position, is_own_domain, competitor_id')
          .in('ai_scan_id', scanIds)
      : { data: [] };

  const citationList = scanCitations || [];

  // 6. Fetch ONLY CONFIRMED Competitors for Project
  const { data: confirmedCompetitors } = await supabase
    .from('competitors')
    .select('id, name, status, domain_id, domains!inner(host)')
    .eq('project_id', projectId)
    .eq('status', 'confirmed');

  const confirmedCompMap = new Map((confirmedCompetitors || []).map((c) => [c.id, c]));

  // ---------------------------------------------------------------------------
  // RULE 1: Citation Opportunity (Category: citation_opportunity)
  // External citations where own domain was not cited
  // ---------------------------------------------------------------------------
  const externalCitations = citationList.filter((c) => !c.is_own_domain);
  if (externalCitations.length > 0 && scanList.length > 0) {
    const citationEvidence: EvidenceRef[] = externalCitations.slice(0, 5).map((c) => {
      const compInfo = c.competitor_id ? confirmedCompMap.get(c.competitor_id) : null;
      const noteStr = compInfo
        ? `External citation on ${c.url} cited confirmed competitor '${compInfo.name}'.`
        : `External third-party citation on ${c.url} during AI scan execution.`;
      return {
        citationId: c.id,
        aiScanId: c.ai_scan_id,
        competitorId: c.competitor_id || null,
        notes: noteStr,
      };
    });

    const impact = computeImpactScore(4, citationEvidence.length);
    const effort = 3; // moderate
    const priority = determinePriority(impact, effort);

    issues.push({
      scopeKey: `citation_opportunity:project:${projectId}`,
      title: 'Build Citations on High-Authority AI Sources',
      description: `AI search engines cited external sources ${externalCitations.length} time(s) across recent scans where your domain was missing. Establishing brand presence on these sources will boost recommendation probability.`,
      category: 'citation_opportunity',
      impactScore: impact,
      effortScore: effort,
      priority,
      evidence: citationEvidence,
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 2: Structured Schema Markup Missing (Category: schema)
  // Pages lacking JSON-LD Schema.org metadata
  // ---------------------------------------------------------------------------
  const missingSchemaPages = pagesList.filter((p) => {
    const meta = metaMap.get(p.id);
    return !meta || !meta.schema_json;
  });

  if (missingSchemaPages.length > 0) {
    const schemaEvidence: EvidenceRef[] = missingSchemaPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      notes: `Page ${p.url} is missing structured Schema.org JSON-LD markup.`,
    }));

    const impact = computeImpactScore(3, schemaEvidence.length);
    const effort = 2; // quick win
    const priority = determinePriority(impact, effort);

    issues.push({
      scopeKey: `schema:missing:${projectId}`,
      title: 'Implement Structured Schema.org JSON-LD Markup',
      description: `${missingSchemaPages.length} crawled page(s) lack structured JSON-LD schema metadata. Schema markup helps AI search bots accurately parse brand entity properties.`,
      category: 'schema',
      impactScore: impact,
      effortScore: effort,
      priority,
      evidence: schemaEvidence,
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 3: Meta Description Optimization (Category: metadata)
  // Pages missing meta descriptions
  // ---------------------------------------------------------------------------
  const missingMetaPages = pagesList.filter((p) => {
    const meta = metaMap.get(p.id);
    return !meta || !meta.meta_description || meta.meta_description.trim().length === 0;
  });

  if (missingMetaPages.length > 0) {
    const metaEvidence: EvidenceRef[] = missingMetaPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      notes: `Page ${p.url} lacks a meta description tag.`,
    }));

    const impact = computeImpactScore(2, metaEvidence.length);
    const effort = 1; // quick win
    const priority = determinePriority(impact, effort);

    issues.push({
      scopeKey: `metadata:descriptions:${projectId}`,
      title: 'Add Concise Meta Descriptions to Crawled Pages',
      description: `${missingMetaPages.length} page(s) are missing meta descriptions. Clear meta descriptions provide key snippet text for AI web crawlers.`,
      category: 'metadata',
      impactScore: impact,
      effortScore: effort,
      priority,
      evidence: metaEvidence,
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 4: HTTP Technical SEO Errors (Category: technical_seo)
  // Pages returning non-200 HTTP status codes
  // ---------------------------------------------------------------------------
  const erroredPages = pagesList.filter(
    (p) => p.status_code !== null && p.status_code !== 200
  );

  if (erroredPages.length > 0) {
    const techEvidence: EvidenceRef[] = erroredPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      notes: `Page ${p.url} returned HTTP status ${p.status_code}.`,
    }));

    const impact = computeImpactScore(5, techEvidence.length);
    const effort = 2; // quick win
    const priority = determinePriority(impact, effort);

    issues.push({
      scopeKey: `technical_seo:errors:${projectId}`,
      title: 'Resolve HTTP Server & Broken Link Response Errors',
      description: `${erroredPages.length} page(s) returned non-200 HTTP response status codes. Broken URLs prevent AI search crawlers from accessing site content.`,
      category: 'technical_seo',
      impactScore: impact,
      effortScore: effort,
      priority,
      evidence: techEvidence,
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 5: AI Visibility Score Deficit (Category: ai_visibility)
  // Scans where target brand was not mentioned
  // ---------------------------------------------------------------------------
  const unmentionedScans = scanList.filter((s) => !s.is_mentioned);

  if (unmentionedScans.length > 0) {
    const scanEvidence: EvidenceRef[] = unmentionedScans.slice(0, 5).map((s) => ({
      aiScanId: s.id,
      notes: `AI scan for prompt "${s.prompt_text}" resulted in zero brand mentions on ${s.model_name || 'Gemini'}.`,
    }));

    const impact = computeImpactScore(4, scanEvidence.length);
    const effort = 4; // significant
    const priority = determinePriority(impact, effort);

    issues.push({
      scopeKey: `ai_visibility:unmentioned:${projectId}`,
      title: 'Optimize Brand Positioning for AI Search Prompts',
      description: `${unmentionedScans.length} recent AI search scan(s) yielded no brand mentions. Enhancing topical relevance will increase your brand recommendation presence.`,
      category: 'ai_visibility',
      impactScore: impact,
      effortScore: effort,
      priority,
      evidence: scanEvidence,
    });
  }

  return issues;
}
