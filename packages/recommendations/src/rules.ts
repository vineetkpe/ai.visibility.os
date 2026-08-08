import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { DetectedIssue, EvidenceRef } from './types';
import { computeImpactScore } from './formula';

/**
 * Deterministic Issue Detection Engine.
 * Evaluates real project evidence (crawled pages, business context, AI scans, citations, competitor benchmarks)
 * to detect actionable optimization issues with zero hallucination.
 */
export async function detectProjectIssues(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<DetectedIssue[]> {
  const issues: DetectedIssue[] = [];

  // 1. Fetch Project Domains & Pages
  const { data: domains } = await supabase
    .from('domains')
    .select('id, host, is_primary')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const ownDomains = (domains || []).filter((d) => d.is_primary);
  const ownDomainIds = ownDomains.map((d) => d.id);

  const { data: ownPages } = ownDomainIds.length > 0
    ? await supabase
        .from('pages')
        .select('id, url, title, http_status, meta_description, canonical_url, schema_org_types, word_count, crawl_status')
        .in('domain_id', ownDomainIds)
    : { data: [] };

  const pagesList = ownPages || [];

  const targetSchemaTypes = ['Organization', 'WebSite'];

  // 3. Fetch Completed Scans
  const { data: completedScans } = await supabase
    .from('scans')
    .select('id, query_prompt, ai_model, visibility_score, created_at')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const scanList = completedScans || [];
  const scanIds = scanList.map((s) => s.id);

  // 4. Fetch Citations across completed scans
  const { data: scanCitations } = scanIds.length > 0
    ? await supabase
        .from('citations')
        .select('id, scan_id, source_url, source_domain, is_own_domain, competitor_id')
        .in('scan_id', scanIds)
    : { data: [] };

  const citationList = scanCitations || [];

  // 5. Fetch Competitors & Competitor Scans
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name, domain_name')
    .eq('project_id', projectId);

  const competitorList = competitors || [];
  const competitorIds = competitorList.map((c) => c.id);

  const { data: compScans } = competitorIds.length > 0 && scanIds.length > 0
    ? await supabase
        .from('competitor_scans')
        .select('id, competitor_id, scan_id, visibility_score, mention_count')
        .in('scan_id', scanIds)
        .in('competitor_id', competitorIds)
    : { data: [] };

  const compScanList = compScans || [];

  // ---------------------------------------------------------------------------
  // RULE 1: Citation Opportunity (Category: citation_opportunity)
  // Target domain is missing citations on AI scan prompts where external/competitor domains were cited.
  // ---------------------------------------------------------------------------
  const externalCitations = citationList.filter((c) => !c.is_own_domain);
  if (externalCitations.length > 0 && scanList.length > 0) {
    const citationEvidence: EvidenceRef[] = externalCitations.slice(0, 5).map((c) => ({
      citationId: c.id,
      scanId: c.scan_id,
      description: `External citation detected on ${c.source_domain} (${c.source_url}) during AI scan, where own domain was not cited.`,
    }));

    // Find linked competitor scans for additional evidence
    const linkedCompScans = compScanList.filter((cs) => (cs.mention_count || 0) > 0);
    if (linkedCompScans.length > 0 && linkedCompScans[0]) {
      citationEvidence.push({
        competitorScanId: linkedCompScans[0].id,
        scanId: linkedCompScans[0].scan_id,
        description: `Tracked competitor was mentioned ${linkedCompScans[0].mention_count} time(s) on AI search prompt.`,
      });
    }

    if (citationEvidence.length > 0) {
      const rawImpact = computeImpactScore(60, citationEvidence.length, linkedCompScans.length > 0);

      issues.push({
        scopeKey: `citation_opportunity:project:${projectId}`,
        title: `Build Citations on Sources Cited by AI Search Engines`,
        summary: `AI models cited external sources ${externalCitations.length} time(s) across recent scans where your domain was not cited. Targeting these source domains will directly increase AI recommendation likelihood.`,
        category: 'citation_opportunity',
        rawImpactScore: rawImpact,
        effort: 'moderate',
        evidence: citationEvidence,
        implementationSteps: [
          'Review top third-party domains cited in AI responses (e.g. industry reviews, directory listings).',
          'Identify missing profiles or unlinked brand mentions on these external source sites.',
          'Publish outreach or updated brand profiles to earn direct citations on high-frequency AI sources.',
        ],
      });
    }
  }

  // ---------------------------------------------------------------------------
  // RULE 2: Structured Schema Markup (Category: schema)
  // Crawled pages are missing Schema.org structured data.
  // ---------------------------------------------------------------------------
  const missingSchemaPages = pagesList.filter((p) => {
    const types = p.schema_org_types || [];
    return types.length === 0 || !targetSchemaTypes.some((t) => types.includes(t));
  });

  if (missingSchemaPages.length > 0) {
    const schemaEvidence: EvidenceRef[] = missingSchemaPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      description: `Page ${p.url} is missing structured Schema.org markup (found: ${
        (p.schema_org_types || []).join(', ') || 'none'
      }, expected: ${targetSchemaTypes.join(', ')}).`,
    }));

    const rawImpact = computeImpactScore(55, schemaEvidence.length, false);

    issues.push({
      scopeKey: `schema:pages:${projectId}`,
      title: `Implement Missing Schema.org Structured Data`,
      summary: `${missingSchemaPages.length} crawled page(s) lack essential Schema.org structured data (${targetSchemaTypes.join(', ')}). Structured JSON-LD helps AI models parse brand entities accurately.`,
      category: 'schema',
      rawImpactScore: rawImpact,
      effort: 'moderate',
      evidence: schemaEvidence,
      implementationSteps: [
        `Add JSON-LD script tags with ${targetSchemaTypes.join(' and ')} schema definitions to affected pages.`,
        'Validate JSON-LD syntax using Google Rich Results Test or Schema Validator.',
        'Re-crawl the site to verify schema extraction by AI Visibility OS.',
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 3: Metadata Optimization (Category: metadata)
  // Pages missing meta descriptions or canonical tags.
  // ---------------------------------------------------------------------------
  const missingMetaPages = pagesList.filter((p) => !p.meta_description || p.meta_description.trim().length === 0);

  if (missingMetaPages.length > 0) {
    const metaEvidence: EvidenceRef[] = missingMetaPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      description: `Page ${p.url} is missing a meta description, reducing snippet extraction clarity for AI web crawlers.`,
    }));

    const rawImpact = computeImpactScore(45, metaEvidence.length, false);

    issues.push({
      scopeKey: `metadata:descriptions:${projectId}`,
      title: `Add Descriptive Meta Descriptions to Pages`,
      summary: `${missingMetaPages.length} page(s) are missing meta descriptions. Concise, keyword-rich meta descriptions aid AI crawlers in indexing page intent.`,
      category: 'metadata',
      rawImpactScore: rawImpact,
      effort: 'quick_win',
      evidence: metaEvidence,
      implementationSteps: [
        'Write 140-160 character meta descriptions summarizing core page value and target keywords.',
        'Add <meta name="description"> tags to head elements on affected pages.',
        'Ensure unique descriptions across all indexed URLs.',
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 4: Thin Content Enrichment (Category: content)
  // Pages with low word count (< 300 words).
  // ---------------------------------------------------------------------------
  const thinContentPages = pagesList.filter((p) => (p.word_count || 0) > 0 && (p.word_count || 0) < 300);

  if (thinContentPages.length > 0) {
    const thinEvidence: EvidenceRef[] = thinContentPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      description: `Page ${p.url} has thin body content (${p.word_count || 0} words), below the 300-word recommendation for comprehensive AI indexing.`,
    }));

    const rawImpact = computeImpactScore(50, thinEvidence.length, false);

    issues.push({
      scopeKey: `content:thin:${projectId}`,
      title: `Enrich Thin Content Pages for AI Search Indexing`,
      summary: `${thinContentPages.length} page(s) contain under 300 words. Comprehensive content provides rich context for LLM retrieval and citation generation.`,
      category: 'content',
      rawImpactScore: rawImpact,
      effort: 'significant',
      evidence: thinEvidence,
      implementationSteps: [
        'Expand thin pages with detailed explanations, FAQ sections, and structured headings (H2/H3).',
        'Incorporate target domain topics identified in business context.',
        'Re-crawl updated pages to confirm word count increase.',
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 5: Technical Crawl Errors (Category: technical_seo)
  // Pages returning non-200 HTTP status or failed crawl status.
  // ---------------------------------------------------------------------------
  const erroredPages = pagesList.filter((p) => (p.http_status && p.http_status !== 200) || p.crawl_status === 'failed');

  if (erroredPages.length > 0) {
    const techEvidence: EvidenceRef[] = erroredPages.slice(0, 5).map((p) => ({
      pageId: p.id,
      description: `Page ${p.url} encountered crawl error / HTTP status ${p.http_status || 'failed'}.`,
    }));

    const rawImpact = computeImpactScore(75, techEvidence.length, false);

    issues.push({
      scopeKey: `technical_seo:errors:${projectId}`,
      title: `Fix HTTP Errors and Failed Crawl Pages`,
      summary: `${erroredPages.length} page(s) returned HTTP errors or failed during discovery crawl. Broken links prevent AI models from retrieving page content.`,
      category: 'technical_seo',
      rawImpactScore: rawImpact,
      effort: 'quick_win',
      evidence: techEvidence,
      implementationSteps: [
        'Inspect HTTP response status codes for failing URLs.',
        'Fix 4xx broken URLs with 301 redirects or restore missing content.',
        'Ensure server returns clean HTTP 200 responses to web crawlers.',
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // RULE 6: AI Visibility Score Deficit (Category: ai_visibility)
  // Scans where overall visibility score is below 50.
  // ---------------------------------------------------------------------------
  const lowScans = scanList.filter((s) => s.visibility_score !== null && (s.visibility_score || 0) < 50);

  if (lowScans.length > 0) {
    const scanEvidence: EvidenceRef[] = lowScans.slice(0, 5).map((s) => ({
      scanId: s.id,
      description: `AI scan for prompt "${s.query_prompt}" yielded a low visibility score of ${s.visibility_score}/100 on ${s.ai_model}.`,
    }));

    const avgScore = Math.round(
      lowScans.reduce((acc, s) => acc + (s.visibility_score || 0), 0) / lowScans.length
    );
    const rawImpact = computeImpactScore(100 - avgScore, scanEvidence.length, true);

    issues.push({
      scopeKey: `ai_visibility:low_scans:${projectId}`,
      title: `Improve AI Search Visibility on Low-Scoring Prompts`,
      summary: `${lowScans.length} recent AI search scan(s) yielded low visibility scores (avg ${avgScore}/100). Competitor brands currently dominate these prompts.`,
      category: 'ai_visibility',
      rawImpactScore: rawImpact,
      effort: 'significant',
      evidence: scanEvidence,
      implementationSteps: [
        'Analyze query prompts with low visibility scores to identify target user intent.',
        'Create targeted landing pages matching specific AI prompt queries.',
        'Build co-occurrence entity mentions across industry publication channels.',
      ],
    });
  }

  return issues;
}
