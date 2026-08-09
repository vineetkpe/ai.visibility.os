export interface PageMetadataRecord {
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  language: string | null;
  schema_json: Record<string, unknown> | Array<Record<string, unknown>> | null;
  open_graph: Record<string, unknown> | null;
  twitter_cards: Record<string, unknown> | null;
}

export interface JoinedPageRecord {
  id: string;
  url: string;
  path: string;
  status_code: number | null;
  content_type: string | null;
  last_crawled_at: string | null;
  page_metadata: PageMetadataRecord | PageMetadataRecord[] | null;
}

export type SchemaEntityType = 'organization' | 'person' | 'brand' | 'location' | 'other';
export type SchemaExtractionMethod = 'deterministic' | 'ai_assisted';

export interface ExtractedEntity {
  entity_type: SchemaEntityType;
  name: string;
  description: string | null;
  source_page_id: string | null;
  extraction_method: SchemaExtractionMethod;
  confidence_score: number | null;
}

export interface ExtractedTopic {
  name: string;
  relevance_score: number | null;
  source_page_id: string | null;
  extraction_method: SchemaExtractionMethod;
}

export interface ExtractedProduct {
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  source_page_id: string | null;
  extraction_method: SchemaExtractionMethod;
  confidence_score: number | null;
}

export interface ExtractedService {
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  source_page_id: string | null;
  extraction_method: SchemaExtractionMethod;
  confidence_score: number | null;
}

export interface ExtractedTechnology {
  name: string;
  category: string | null;
  source_page_id: string | null;
}

export interface ExtractedBusinessContextData {
  industry: string | null;
  description: string | null;
  value_proposition: string | null;
  target_audience: string[] | null;
  confidence_score: number | null;
  extraction_method: SchemaExtractionMethod;
  entities: ExtractedEntity[];
  topics: ExtractedTopic[];
  products: ExtractedProduct[];
  services: ExtractedService[];
  technologies: ExtractedTechnology[];
}

export interface BusinessContextPipelineOptions {
  projectId: string;
  generationMethod?: SchemaExtractionMethod;
  maxPagesForSynthesis?: number;
  maxCharLengthForSynthesis?: number;
}

export interface BusinessContextPipelineResult {
  projectId: string;
  contextVersionId: string;
  versionNumber: number;
  entitiesCount: number;
  topicsCount: number;
  productsCount: number;
  servicesCount: number;
  technologiesCount: number;
  status: 'completed' | 'failed';
  error?: string;
}
