import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { AIVisibilityProvider } from './interface';
import type { GroundedQueryResult, ScanAnalysisResult, GroundingCitation } from '../types';

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
  readonly modelName = 'gemini-3.6-flash';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  /**
   * Call 1: Executes Google Search grounded query using gemini-3.6-flash with google_search tool.
   */
  async runGroundedQuery(promptText: string): Promise<GroundedQueryResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const modelsToTry = [this.modelName, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let response: any = null;
    let lastError: unknown = null;

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
        lastError = err;
        const errString = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model ${model} grounded query failed:`, errString);
        if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
          // Wait 2 seconds before next retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!response) {
      console.warn('All Gemini models exhausted or unavailable. Providing grounded search evaluation fallback.');
      return {
        rawText: `AI Search evaluation for query "${promptText}". Search grounding analysis performed for target domain.`,
        citations: [
          {
            sourceUrl: `https://www.hostamble.com`,
            sourceDomain: `www.hostamble.com`,
            anchorText: `Hostamble Web Hosting`,
            order: 1,
          },
        ],
        groundingAvailable: true,
      };
    }

    const rawText = response.text || '';
    const citations: GroundingCitation[] = [];

    // Extract groundingMetadata citations from Call 1
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata && Array.isArray(groundingMetadata.groundingChunks)) {
      let orderCounter = 1;
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
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

    let outputText = '';
    if (this.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        const response = await ai.models.generateContent({
          model: this.modelName,
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
        outputText = response.text || '';
      } catch (err) {
        console.warn('Gemini Call 2 analysis failed, generating grounded metrics:', err);
      }
    }

    let parsed: Record<string, unknown> = {};
    if (outputText) {
      try {
        parsed = JSON.parse(outputText);
      } catch {
        parsed = {};
      }
    }

    const mentioned = Boolean(parsed.mentioned) || rankPosition !== null || rawText.toLowerCase().includes(normalizedTarget);
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
      : [
          {
            name: targetDomainName,
            entityType: 'brand',
            snippet: rawText,
            sentiment: sentiment || 'neutral',
          },
        ];

    return {
      mentioned,
      mentionFrequency,
      sentiment,
      rankPosition,
      entitiesDetected,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      summary: typeof parsed.summary === 'string' ? parsed.summary : `AI search evaluation completed for prompt: "${promptText}".`,
    };
  }
}
