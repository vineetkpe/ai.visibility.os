export interface FrequentlyCitedPage {
  sourceUrl: string;
  count: number;
}

export interface CoOccurringEntity {
  name: string;
  type: string;
  count: number;
}

export interface ImportantCompetitorPage {
  id: string;
  url: string;
  title: string | null;
  httpStatus: number | null;
  wordCount: number | null;
}

export interface MetricAvailableResult<T> {
  available: true;
  data: T;
}

export interface MetricUnavailableResult {
  available: false;
  reason: string;
}

export type MetricResult<T> = MetricAvailableResult<T> | MetricUnavailableResult;

export interface SharedTopicsData {
  topics: string[];
  count: number;
}

export interface MissingTopicsData {
  topics: string[];
  count: number;
}

export interface SchemaCoverageData {
  userSchemas: string[];
  competitorSchemas: string[];
  overlap: string[];
  missingInUser: string[];
}

export interface EntityCoverageData {
  userEntities: string[];
  competitorEntities: string[];
  overlap: string[];
  missingInUser: string[];
}

export interface ContentOverlapData {
  scorePercentage: number;
  matchingKeywords: string[];
}

export interface Tier2ComparisonMetrics {
  sharedTopics: MetricResult<SharedTopicsData>;
  missingTopics: MetricResult<MissingTopicsData>;
  schemaCoverage: MetricResult<SchemaCoverageData>;
  entityCoverage: MetricResult<EntityCoverageData>;
  contentOverlap: MetricResult<ContentOverlapData>;
}

export interface Tier1AlwaysAvailableMetrics {
  aiMentions: {
    totalMentions: number;
    scansEvaluated: number;
  };
  citationCount: number;
  frequentlyCitedPages: FrequentlyCitedPage[];
}

export interface ComparisonMetrics {
  tier1: Tier1AlwaysAvailableMetrics;
  tier2: Tier2ComparisonMetrics;
}

export interface CompetitorProfile {
  id: string;
  projectId: string;
  companyName: string;
  domain: string;
  domainId: string | null;
  detectedFrom: string;
  firstSeen: string | null;
  lastSeen: string | null;
  visibilityScore: number | null;
  citationCount: number;
  frequentlyCitedPages: FrequentlyCitedPage[];
  tier2Available: boolean;
  importantPages: ImportantCompetitorPage[] | null;
  topics: string[] | null;
  entities: CoOccurringEntity[];
  createdAt: string;
}

export interface SuggestionEvidence {
  type: 'entity_mention' | 'citation';
  scanId?: string;
  promptText?: string;
  contextSnippet?: string;
  sourceUrl?: string;
}

export interface CompetitorSuggestion {
  name: string;
  domain: string;
  coOccurrenceCount: number;
  evidence: SuggestionEvidence[];
}
