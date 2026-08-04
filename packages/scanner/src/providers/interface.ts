import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from '../types';

/**
 * Common Provider interface for AI Visibility Engine implementations.
 * Enforces two-call architecture: Grounded Query (Call 1) -> Structured Analysis (Call 2).
 */
export interface AIVisibilityProvider {
  readonly providerName: string;
  readonly modelName: string;

  /**
   * Call 1: Executes a search-grounded query against the target AI engine.
   */
  runGroundedQuery(promptText: string): Promise<GroundedQueryResult>;

  /**
   * Call 2: Performs structured JSON analysis of Call 1's actual returned response and citations.
   */
  analyzeResponse(
    promptText: string,
    rawText: string,
    citations: GroundingCitation[],
    targetDomainName: string
  ): Promise<ScanAnalysisResult>;
}
