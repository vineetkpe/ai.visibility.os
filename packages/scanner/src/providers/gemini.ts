import { GoogleGenAI, Type, type Schema, type GenerateContentResponse } from '@google/genai';
import type { AIVisibilityProvider } from './interface';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from '../types';

interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GeminiProviderOptions {
  apiKey?: string;
  primaryModel?: string;
  fallbackModels?: string[];
}

const analysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mentioned: {
      type: Type.BOOLEAN,
      description:
        'Whether the target domain or brand is explicitly mentioned or cited in the response text or citations.',
    },
    mentionFrequency: {
      type: Type.INTEGER,
      description: 'Count of distinct mentions of the target brand/domain in the text.',
    },
    sentiment: {
      type: Type.STRING,
      description:
        'Sentiment towards the target brand: positive, neutral, negative, mixed, or null if not mentioned.',
    },
    summary: {
      type: Type.STRING,
      description: 'Concise, 1-2 sentence summary of what the response text says about the query.',
    },
    entitiesDetected: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Brand or company or product name detected.' },
          entityType: {
            type: Type.STRING,
            description: 'Type: brand, product, technology, or company.',
          },
          snippet: {
            type: Type.STRING,
            description: 'Context snippet surrounding the entity mention.',
          },
          sentiment: { type: Type.STRING, description: 'Mention sentiment.' },
        },
        required: ['name', 'entityType'],
      },
      description: 'Brands or organization entities mentioned in the response.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score (0.0 to 1.0) of this analysis.',
    },
  },
  required: ['mentioned', 'mentionFrequency', 'summary', 'confidence'],
};

export class GeminiProvider implements AIVisibilityProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;
  readonly fallbackModels: string[];
  private apiKey: string;

  constructor(options?: GeminiProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = options?.primaryModel || 'gemini-3.6-flash';
    this.fallbackModels = options?.fallbackModels || ['gemini-2.5-flash', 'gemini-1.5-flash'];
  }

  /**
   * Helper to format raw error objects into clean, diagnostic error strings.
   */
  private formatError(err: unknown): string {
    if (!err) return 'Unknown error occurred.';
    let message = err instanceof Error ? err.message : String(err);

    // Try parsing JSON error strings returned by GCP / Google SDK
    if (message.startsWith('{') && message.includes('"message"')) {
      try {
        const parsed = JSON.parse(message);
        if (parsed.error?.message) {
          message = parsed.error.message;
        }
      } catch {
        // Keep original if parse fails
      }
    }

    if (
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('429') ||
      message.includes('Quota exceeded')
    ) {
      return `Quota exceeded for Gemini model (${message.trim()})`;
    }
    if (
      message.includes('API_KEY_INVALID') ||
      message.includes('API key not valid') ||
      message.includes('401') ||
      message.includes('403')
    ) {
      return `Google Gemini API Authentication Failed: ${message.trim()}`;
    }
    if (
      message.includes('NOT_FOUND') ||
      message.includes('404') ||
      message.includes('is not found')
    ) {
      return `Gemini Model Unavailable: ${message.trim()}`;
    }

    return message;
  }

  /**
   * Call 1: Executes Google Search grounded query using primary model with fallbacks.
   */
  async runGroundedQuery(promptText: string): Promise<GroundedQueryResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const modelsToTry = Array.from(new Set([this.modelName, ...this.fallbackModels]));
    let response: GenerateContentResponse | null = null;
    const attemptedErrors: string[] = [];

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response) break;
      } catch (err: unknown) {
        const formatted = this.formatError(err);
        attemptedErrors.push(`[${model}]: ${formatted}`);
        console.warn(`Gemini model ${model} grounded query failed:`, formatted);

        // If rate limited or quota error, pause briefly before attempting fallback model
        if (
          formatted.includes('Quota') ||
          formatted.includes('RESOURCE_EXHAUSTED') ||
          formatted.includes('429')
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    if (!response) {
      throw new Error(
        `Gemini AI query failed across models (${modelsToTry.join(', ')}). Errors: ${attemptedErrors.join(' | ')}`
      );
    }

    const rawText = response.text || '';
    const citations: GroundingCitation[] = [];

    // Extract groundingMetadata citations from Call 1
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata && Array.isArray(groundingMetadata.groundingChunks)) {
      let orderCounter = 1;
      (groundingMetadata.groundingChunks as GroundingChunk[]).forEach((chunk) => {
        if (chunk.web?.uri) {
          try {
            const uri = chunk.web.uri;
            const parsedUrl = new URL(uri);
            const domain = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
            citations.push({
              sourceUrl: uri,
              sourceDomain: domain,
              anchorText: chunk.web.title || undefined,
              order: orderCounter++,
            });
          } catch {
            // Ignore invalid URIs
          }
        }
      });
    }

    return {
      rawText,
      citations,
      groundingAvailable: citations.length > 0,
    };
  }

  /**
   * Call 2: Performs structured JSON analysis of Call 1's actual returned response and citations.
   */
  async analyzeResponse(
    promptText: string,
    rawText: string,
    citations: GroundingCitation[],
    targetDomainName: string
  ): Promise<ScanAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const normalizedTarget = targetDomainName.toLowerCase().replace(/^www\./, '');

    // Calculate rank position in citation list (1-based index)
    let rankPosition: number | null = null;
    const ownCitationIndex = citations.findIndex((c) => {
      const d = c.sourceDomain.toLowerCase().replace(/^www\./, '');
      return d === normalizedTarget || d.endsWith(`.${normalizedTarget}`);
    });

    if (ownCitationIndex !== -1) {
      rankPosition = ownCitationIndex + 1;
    }

    const citationSummary = citations
      .map((c) => `[#${c.order}] ${c.sourceDomain} (${c.sourceUrl})`)
      .join('\n');

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const modelsToTry = Array.from(new Set([this.modelName, ...this.fallbackModels]));
    let response: GenerateContentResponse | null = null;
    const attemptedErrors: string[] = [];

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an objective AI search visibility auditor. Analyze ONLY the provided AI response text and web citations below for query "${promptText}".
Target Domain: "${targetDomainName}"

CRITICAL INSTRUCTIONS:
- Analyze ONLY what is explicitly stated in the response text or citations.
- Do NOT infer or invent a mention, sentiment, or citation not present in this text.

RESPONSE TEXT:
${rawText}

REAL CITATIONS:
${citationSummary || 'None'}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: analysisResponseSchema,
          },
        });
        if (response) break;
      } catch (err: unknown) {
        const formatted = this.formatError(err);
        attemptedErrors.push(`[${model}]: ${formatted}`);
      }
    }

    if (!response) {
      throw new Error(
        `Gemini analysis failed across models (${modelsToTry.join(', ')}). Errors: ${attemptedErrors.join(' | ')}`
      );
    }

    const outputText = response.text || '';
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = {};
    }

    const mentioned = Boolean(parsed.mentioned) || rankPosition !== null;
    const mentionFrequency =
      typeof parsed.mentionFrequency === 'number' ? parsed.mentionFrequency : mentioned ? 1 : 0;
    const validSentiments = ['positive', 'neutral', 'negative', 'mixed'];
    const rawSentiment =
      typeof parsed.sentiment === 'string' ? parsed.sentiment.toLowerCase() : null;
    const sentiment = validSentiments.includes(rawSentiment || '')
      ? (rawSentiment as ScanAnalysisResult['sentiment'])
      : mentioned
        ? 'neutral'
        : null;

    const entitiesDetected = Array.isArray(parsed.entitiesDetected)
      ? (parsed.entitiesDetected as Array<Record<string, string>>).map((e) => ({
          name: e.name || 'Unknown',
          entityType: e.entityType || 'company',
          snippet: e.snippet,
          sentiment: e.sentiment,
        }))
      : [];

    return {
      mentioned,
      mentionFrequency,
      sentiment,
      rankPosition,
      entitiesDetected,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Query executed successfully.',
    };
  }
}
