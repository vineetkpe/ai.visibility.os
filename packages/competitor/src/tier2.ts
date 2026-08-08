import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { Tier2ComparisonMetrics, MetricResult } from './types';

/**
 * Computes Tier 2 real content comparison metrics comparing the project's own business context / pages
 * against the competitor's crawled pages.
 * If the competitor domain has NOT been crawled yet, Tier 2 metrics return explicit unavailable objects.
 */
export async function computeTier2Comparison(
  supabase: SupabaseClient<Database>,
  projectId: string,
  competitorId: string
): Promise<Tier2ComparisonMetrics> {
  const unavailableReason =
    'Competitor domain has not been crawled yet. Trigger a competitor crawl to unlock content comparison metrics.';

  // 1. Fetch target competitor
  const { data: competitor } = await supabase
    .from('competitors')
    .select('id, name, domain_name, domain_id')
    .eq('id', competitorId)
    .single();

  if (!competitor || !competitor.domain_id) {
    return createUnavailableTier2Metrics(unavailableReason);
  }

  // 2. Fetch competitor crawled pages
  const { data: competitorPages } = await supabase
    .from('pages')
    .select('id, url, title, schema_org_types, headings, meta_description')
    .eq('domain_id', competitor.domain_id);

  if (!competitorPages || competitorPages.length === 0) {
    return createUnavailableTier2Metrics(unavailableReason);
  }

  // 3. Fetch user's primary domain and pages
  const { data: ownDomains } = await supabase
    .from('domains')
    .select('id, host')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .limit(1);

  const ownDomainId = ownDomains?.[0]?.id;

  let ownPages: Array<{
    id: string;
    url: string;
    title: string | null;
    schema_org_types: string[] | null;
    headings: unknown;
    meta_description: string | null;
  }> = [];

  if (ownDomainId) {
    const { data: pData } = await supabase
      .from('pages')
      .select('id, url, title, schema_org_types, headings, meta_description')
      .eq('domain_id', ownDomainId);
    if (pData) ownPages = pData;
  }

  // 4. Fetch user's current business context fields
  const { data: currentVersion } = await supabase
    .from('business_context_versions')
    .select('id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  let ownContextTokens: string[] = [];
  if (currentVersion && currentVersion[0]) {
    const { data: fields } = await supabase
      .from('business_context_fields')
      .select('field_value')
      .eq('context_version_id', currentVersion[0].id);

    if (fields) {
      ownContextTokens = fields.flatMap((f) => tokenizeText(f.field_value));
    }
  }

  // Tokenize own domain page titles & context
  const ownPageTokens = ownPages.flatMap((p) => tokenizeText(p.title || ''));
  const allOwnTokens = Array.from(new Set([...ownContextTokens, ...ownPageTokens]));

  // Tokenize competitor page titles, headings, and descriptions
  const competitorTokens = Array.from(
    new Set(
      competitorPages.flatMap((p) => [
        ...tokenizeText(p.title || ''),
        ...tokenizeText(p.meta_description || ''),
      ])
    )
  );

  // A. Shared topics & Missing topics
  const sharedTopics = competitorTokens.filter((token) => allOwnTokens.includes(token));
  const missingTopics = competitorTokens.filter((token) => !allOwnTokens.includes(token));

  // B. Schema coverage
  const userSchemas = Array.from(new Set(ownPages.flatMap((p) => p.schema_org_types || [])));
  const competitorSchemas = Array.from(
    new Set(competitorPages.flatMap((p) => p.schema_org_types || []))
  );
  const schemaOverlap = competitorSchemas.filter((s) => userSchemas.includes(s));
  const missingSchemasInUser = competitorSchemas.filter((s) => !userSchemas.includes(s));

  // C. Entity coverage
  const { data: ownMentions } = await supabase
    .from('entity_mentions')
    .select('entities!inner(name)')
    .not('scan_id', 'is', null);

  const ownEntities = Array.from(
    new Set(
      (ownMentions || []).map((m) => {
        const entObj = Array.isArray(m.entities)
          ? m.entities[0]
          : (m.entities as { name?: string } | null);
        return (entObj?.name || '').toLowerCase();
      })
    )
  ).filter(Boolean);

  const compEntities = competitorTokens.filter((t) => t.length > 4);
  const entityOverlap = compEntities.filter((e) => ownEntities.includes(e));
  const missingEntitiesInUser = compEntities.filter((e) => !ownEntities.includes(e));

  // D. Content overlap percentage
  let overlapScore = 0;
  if (competitorTokens.length > 0) {
    overlapScore = Math.round((sharedTopics.length / competitorTokens.length) * 100);
  }

  return {
    sharedTopics: {
      available: true,
      data: {
        topics: sharedTopics.slice(0, 20),
        count: sharedTopics.length,
      },
    },
    missingTopics: {
      available: true,
      data: {
        topics: missingTopics.slice(0, 20),
        count: missingTopics.length,
      },
    },
    schemaCoverage: {
      available: true,
      data: {
        userSchemas,
        competitorSchemas,
        overlap: schemaOverlap,
        missingInUser: missingSchemasInUser,
      },
    },
    entityCoverage: {
      available: true,
      data: {
        userEntities: ownEntities.slice(0, 20),
        competitorEntities: compEntities.slice(0, 20),
        overlap: entityOverlap.slice(0, 20),
        missingInUser: missingEntitiesInUser.slice(0, 20),
      },
    },
    contentOverlap: {
      available: true,
      data: {
        scorePercentage: overlapScore,
        matchingKeywords: sharedTopics.slice(0, 15),
      },
    },
  };
}

function tokenizeText(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'your',
    'have',
    'more',
    'about',
  ]);
  return text
    .toLowerCase()
    .split(/[\s|,\-:/.]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function createUnavailableTier2Metrics(reason: string): Tier2ComparisonMetrics {
  const unavail: MetricResult<never> = { available: false, reason };
  return {
    sharedTopics: unavail as MetricResult<never>,
    missingTopics: unavail as MetricResult<never>,
    schemaCoverage: unavail as MetricResult<never>,
    entityCoverage: unavail as MetricResult<never>,
    contentOverlap: unavail as MetricResult<never>,
  };
}
