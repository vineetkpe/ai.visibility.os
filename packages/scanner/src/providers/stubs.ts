import type { AIVisibilityProvider } from './interface';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from '../types';

abstract class StubProvider implements AIVisibilityProvider {
  abstract readonly providerName: string;
  abstract readonly modelName: string;

  async runGroundedQuery(): Promise<GroundedQueryResult> {
    throw new Error(`Provider '${this.providerName}' is not implemented for Phase 1 MVP.`);
  }

  async analyzeResponse(
    _promptText: string,
    _rawText: string,
    _citations: GroundingCitation[],
    _targetDomainName: string
  ): Promise<ScanAnalysisResult> {
    throw new Error(`Provider '${this.providerName}' is not implemented for Phase 1 MVP.`);
  }
}

export class ChatGPTProvider extends StubProvider {
  readonly providerName = 'chatgpt';
  readonly modelName = 'gpt-4o';
}

export class ClaudeProvider extends StubProvider {
  readonly providerName = 'claude';
  readonly modelName = 'claude-3-5-sonnet';
}

export class PerplexityProvider extends StubProvider {
  readonly providerName = 'perplexity';
  readonly modelName = 'sonar-pro';
}

export class DeepSeekProvider extends StubProvider {
  readonly providerName = 'deepseek';
  readonly modelName = 'deepseek-r1';
}

export class GrokProvider extends StubProvider {
  readonly providerName = 'grok';
  readonly modelName = 'grok-2';
}
