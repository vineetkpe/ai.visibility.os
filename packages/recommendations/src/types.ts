export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type ExtractionMethod = 'deterministic' | 'ai_assisted';

export interface EvidenceRef {
  id?: string;
  pageId?: string | null;
  aiScanId?: string | null;
  citationId?: string | null;
  competitorId?: string | null;
  notes?: string | null;
}

export interface DetectedIssue {
  scopeKey: string;
  title: string;
  description: string;
  category: string;
  impactScore: number; // 1..5
  effortScore: number; // 1..5
  priority: RecommendationPriority;
  evidence: EvidenceRef[];
}

export interface Recommendation {
  id: string;
  projectId: string;
  scanId: string | null;
  category: string;
  title: string;
  description: string | null;
  impactScore: number;
  effortScore: number;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  scopeKey: string;
  generationMethod: ExtractionMethod;
  supersededBy: string | null;
  resolvedByScanId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceRef[];
  affectedPages: string[];
}

export interface RecommendationEngineRunResult {
  projectId: string;
  detectedCount: number;
  createdCount: number;
  updatedCount: number;
  autoResolvedCount: number;
  recommendations: Recommendation[];
}
