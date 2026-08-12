import type { AIVisibilityProvider } from './interface';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from '../types';

export interface OpenAICompatibleProviderOptions {
  apiKey: string;
  primaryModel: string;
  baseUrl?: string;
}

export class OpenAICompatibleProvider implements AIVisibilityProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly fallbackModels: string[] = [];
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OpenAICompatibleProviderOptions & { providerName?: string }) {
    this.providerName = options.providerName || 'openai-compatible';
    this.modelName = options.primaryModel;
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  private async complete(model: string, messages: Array<{ role: 'system' | 'user'; content: string }>, json = false) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model, messages, ...(json ? { response_format: { type: 'json_object' } } : {}) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `Provider request failed with HTTP ${response.status}`);
    return String(payload?.choices?.[0]?.message?.content || '');
  }

  async runGroundedQuery(promptText: string): Promise<GroundedQueryResult> {
    const rawText = await this.complete(this.modelName, [
      { role: 'system', content: 'Answer the user query directly and factually. Do not invent citations or claim web access you do not have.' },
      { role: 'user', content: promptText },
    ]);
    return { rawText, citations: [], groundingAvailable: false };
  }

  async analyzeResponse(promptText: string, rawText: string, citations: GroundingCitation[], targetDomainName: string): Promise<ScanAnalysisResult> {
    const output = await this.complete(this.modelName, [{
      role: 'system',
      content: 'Return only JSON with keys: mentioned(boolean), mentionFrequency(number), sentiment(string|null), summary(string), confidence(number), entitiesDetected(array).',
    }, {
      role: 'user',
      content: `Analyze this AI answer for query "${promptText}". Target domain: "${targetDomainName}".\n\n${rawText}`,
    }], true);
    let parsed: any = {};
    try { parsed = JSON.parse(output); } catch { parsed = {}; }
    const mentioned = Boolean(parsed.mentioned);
    const sentiment = ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : mentioned ? 'neutral' : null;
    return {
      mentioned,
      mentionFrequency: typeof parsed.mentionFrequency === 'number' ? parsed.mentionFrequency : mentioned ? 1 : 0,
      sentiment,
      rankPosition: null,
      entitiesDetected: Array.isArray(parsed.entitiesDetected) ? parsed.entitiesDetected : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Query executed successfully.',
    };
  }
}
