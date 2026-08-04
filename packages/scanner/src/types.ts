export interface GroundingCitation {
  sourceUrl: string;
  sourceDomain: string;
  anchorText?: string;
  order: number;
}

export interface GroundedQueryResult {
  rawText: string;
  citations: GroundingCitation[];
  groundingAvailable: boolean;
}

export interface DetectedEntity {
  name: string;
  entityType: string;
  snippet?: string;
  sentiment?: string;
}

export interface ScanAnalysisResult {
  mentioned: boolean;
  mentionFrequency: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | null;
  rankPosition: number | null;
  entitiesDetected: DetectedEntity[];
  confidence: number;
  summary: string;
}

export interface VisibilityScanPipelineOptions {
  projectId: string;
  targetDomainName?: string;
}

export interface VisibilityScanPipelineResult {
  projectId: string;
  scansExecuted: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface BusinessContextFieldRecord {
  field_name: string;
  field_value: string;
}
