export type RecommendationCategory =
  | 'content'
  | 'technical_seo'
  | 'schema'
  | 'entity_optimization'
  | 'citation_opportunity'
  | 'internal_linking'
  | 'metadata'
  | 'ai_visibility';

export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';
export type EstimatedImpact = 'high' | 'medium' | 'low';
export type EstimatedEffort = 'quick_win' | 'moderate' | 'significant';
export type GenerationMethod = 'deterministic' | 'ai_phrased';
export type RecommendationStatus = 'open' | 'in_progress' | 'completed' | 'dismissed';

export interface EvidenceRef {
  id?: string;
  pageId?: string | null;
  scanId?: string | null;
  citationId?: string | null;
  competitorScanId?: string | null;
  description: string;
}

export interface DetectedIssue {
  scopeKey: string;
  title: string;
  summary: string;
  category: RecommendationCategory;
  rawImpactScore: number;
  effort: EstimatedEffort;
  evidence: EvidenceRef[];
  implementationSteps: string[];
}

export interface Recommendation {
  id: string;
  projectId: string;
  scanId: string | null;
  scopeKey: string;
  title: string;
  summary: string;
  category: RecommendationCategory;
  priority: PriorityBand;
  estimatedImpact: EstimatedImpact;
  estimatedEffort: EstimatedEffort;
  confidenceScore: number;
  generationMethod: GenerationMethod;
  status: RecommendationStatus;
  evidence: EvidenceRef[];
  affectedPages: string[];
  implementationSteps: string[];
  generatedAt: string;
}

export interface RecommendationEngineRunResult {
  projectId: string;
  detectedCount: number;
  createdCount: number;
  updatedCount: number;
  autoResolvedCount: number;
  recommendations: Recommendation[];
}
