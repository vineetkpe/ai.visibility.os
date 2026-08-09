import type {
  JoinedPageRecord,
  PageMetadataRecord,
  ExtractedBusinessContextData,
  ExtractedEntity,
  ExtractedTopic,
  ExtractedProduct,
  ExtractedService,
  ExtractedTechnology,
} from './types';

function getMetadata(page: JoinedPageRecord): PageMetadataRecord | null {
  if (!page.page_metadata) return null;
  if (Array.isArray(page.page_metadata)) {
    return page.page_metadata[0] || null;
  }
  return page.page_metadata;
}

/**
 * Deterministic extraction pass from crawled pages & metadata.
 */
export function extractDeterministicFields(
  pages: JoinedPageRecord[]
): ExtractedBusinessContextData {
  const entities: ExtractedEntity[] = [];
  const topics: ExtractedTopic[] = [];
  const products: ExtractedProduct[] = [];
  const services: ExtractedService[] = [];
  const technologies: ExtractedTechnology[] = [];

  if (!pages || pages.length === 0) {
    return {
      industry: null,
      description: null,
      value_proposition: null,
      target_audience: null,
      confidence_score: 0.8,
      extraction_method: 'deterministic',
      entities,
      topics,
      products,
      services,
      technologies,
    };
  }

  const firstPage = pages[0];
  const firstMeta = firstPage ? getMetadata(firstPage) : null;

  // 1. Extract brand/company name from title or Schema.org
  let companyName: string | null = null;
  if (firstMeta?.title) {
    const parts = firstMeta.title.split(/[|–—]/);
    if (parts.length > 0 && parts[0]?.trim()) {
      companyName = parts[0].trim();
    }
  }

  if (companyName) {
    entities.push({
      entity_type: 'organization',
      name: companyName,
      description: firstMeta?.meta_description ?? null,
      source_page_id: firstPage?.id ?? null,
      extraction_method: 'deterministic',
      confidence_score: 0.85,
    });
  }

  // 2. Extract Schema.org Products & Services from JSON-LD
  for (const page of pages) {
    const meta = getMetadata(page);
    if (!meta || !meta.schema_json) continue;

    const schemaList = Array.isArray(meta.schema_json) ? meta.schema_json : [meta.schema_json];

    for (const schema of schemaList) {
      if (!schema || typeof schema !== 'object') continue;

      const schemaType = String(schema['@type'] || '');

      if (schemaType === 'Product' && typeof schema.name === 'string') {
        products.push({
          name: schema.name.trim(),
          description: typeof schema.description === 'string' ? schema.description.trim() : null,
          category: typeof schema.category === 'string' ? schema.category.trim() : null,
          url: typeof schema.url === 'string' ? schema.url.trim() : page.url,
          source_page_id: page.id,
          extraction_method: 'deterministic',
          confidence_score: 0.9,
        });
      }

      if (schemaType === 'Service' && typeof schema.name === 'string') {
        services.push({
          name: schema.name.trim(),
          description: typeof schema.description === 'string' ? schema.description.trim() : null,
          category: typeof schema.category === 'string' ? schema.category.trim() : null,
          url: typeof schema.url === 'string' ? schema.url.trim() : page.url,
          source_page_id: page.id,
          extraction_method: 'deterministic',
          confidence_score: 0.9,
        });
      }

      if (
        (schemaType === 'Organization' || schemaType === 'Corporation') &&
        typeof schema.name === 'string'
      ) {
        entities.push({
          entity_type: 'organization',
          name: schema.name.trim(),
          description: typeof schema.description === 'string' ? schema.description.trim() : null,
          source_page_id: page.id,
          extraction_method: 'deterministic',
          confidence_score: 0.95,
        });
      }
    }
  }

  // 3. Extract topics from meta descriptions / keywords if available
  for (const page of pages) {
    const meta = getMetadata(page);
    if (!meta) continue;

    if (meta.meta_description) {
      topics.push({
        name: meta.title || page.path,
        relevance_score: 0.8,
        source_page_id: page.id,
        extraction_method: 'deterministic',
      });
    }
  }

  return {
    industry: null,
    description: firstMeta?.meta_description ?? null,
    value_proposition: null,
    target_audience: null,
    confidence_score: 0.85,
    extraction_method: 'deterministic',
    entities,
    topics,
    products,
    services,
    technologies,
  };
}
