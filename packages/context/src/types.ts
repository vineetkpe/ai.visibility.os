export interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  confidenceScore: number;
  sourcePageId: string | null;
  extractionMethod: 'deterministic' | 'ai_inferred';
}

export interface BusinessContextPipelineOptions {
  projectId: string;
  generationMethod?: string;
  maxPagesForSynthesis?: number;
  maxCharLengthForSynthesis?: number;
}

export interface BusinessContextPipelineResult {
  projectId: string;
  contextVersionId: string;
  versionNumber: number;
  fieldsExtracted: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface PageRecord {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  language: string | null;
  organization_details: Record<string, unknown> | null;
  json_ld: Record<string, unknown>[] | null;
  social_links: Record<string, string> | null;
  headings: Record<string, string[]> | null;
  word_count: number | null;
}
