import type { SupabaseClient, Database, Json } from '@ai-visibility-os/database';
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

  // 1. Fetch target competitor joined with domain
  const { data: competitor } = await supabase
    .from('competitors')
    .select('id, name, domain_id, domains!inner(host)')
    .eq('id', competitorId)
    .single();

  if (!competitor || !competitor.domain_id) {
    return createUnavailableTier2Metrics(unavailableReason);
  }

  // 2. Fetch competitor crawled pages with metadata
  const { data: competitorPages } = await supabase
    .from('pages')
    .select(`
      id,
      url,
      page_metadata (
        title,
        meta_description,
        schema_json
      )
    `)
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
    page_metadata: {
      title: string | null;
      meta_description: string | null;
      schema_json: Json;
    } | null;
  }> = [];

  if (ownDomainId) {
    const { data: pData } = await supabase
      .from('pages')
      .select(`
        id,
        url,
        page_metadata (
          title,
          meta_description,
          schema_json
        )
      `)
      .eq('domain_id', ownDomainId);

    if (pData) {
      ownPages = pData.map((p) => ({
        id: p.id,
        url: p.url,
        page_metadata: Array.isArray(p.page_metadata) ? p.page_metadata[0] || null : p.page_metadata,
      }));
    }
  }

  // 4. Fetch user's current business context topics & description
  const { data: currentVersions } = await supabase
    .from('business_context_versions')
    .select('id, description')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  let ownContextTokens: string[] = [];
  if (currentVersions && currentVersions[0]) {
    const contextId = currentVersions[0].id;
    const { data: topics } = await supabase
      .from('topics')
      .select('name')
      .eq('business_context_version_id', contextId);

    if (topics) {
      ownContextTokens = topics.flatMap((t) => tokenizeText(t.name));
    }
    if (currentVersions[0].description) {
      ownContextTokens.push(...tokenizeText(currentVersions[0].description));
    }
  }

  // Tokenize own domain page titles & context
  const ownPageTokens = ownPages.flatMap((p) => tokenizeText(p.page_metadata?.title || ''));
  const allOwnTokens = Array.from(new Set([...ownContextTokens, ...ownPageTokens]));

  // Tokenize competitor page titles and descriptions
  const competitorTokens = Array.from(
    new Set(
      competitorPages.flatMap((p) => {
        const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
        return [
          ...tokenizeText(meta?.title || ''),
          ...tokenizeText(meta?.meta_description || ''),
        ];
      })
    )
  );

  // A. Shared topics & Missing topics
  const sharedTopics = competitorTokens.filter((token) => allOwnTokens.includes(token));
  const missingTopics = competitorTokens.filter((token) => !allOwnTokens.includes(token));

  // B. Schema coverage (extracted from schema_json @type properties)
  const extractSchemas = (schemaJson: unknown): string[] => {
    if (!schemaJson) return [];
    const list = Array.isArray(schemaJson) ? schemaJson : [schemaJson];
    const types: string[] = [];
    for (const item of list) {
      if (item && typeof item === 'object' && '@type' in item && typeof item['@type'] === 'string') {
        types.push(item['@type']);
      }
    }
    return types;
  };

  const userSchemas = Array.from(
    new Set(ownPages.flatMap((p) => extractSchemas(p.page_metadata?.schema_json)))
  );

  const competitorSchemas = Array.from(
    new Set(
      competitorPages.flatMap((p) => {
        const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
        return extractSchemas(meta?.schema_json);
      })
    )
  );

  const schemaOverlap = competitorSchemas.filter((s) => userSchemas.includes(s));
  const missingSchemasInUser = competitorSchemas.filter((s) => !userSchemas.includes(s));

  // C. Entity coverage
  const { data: ownMentions } = await supabase
    .from('entity_mentions')
    .select('tracked_entities!inner(name)');

  const ownEntities = Array.from(
    new Set(
      (ownMentions || []).map((m) => {
        const entObj = (m.tracked_entities as unknown as { name: string }) || {};
        return (entObj.name || '').toLowerCase();
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
