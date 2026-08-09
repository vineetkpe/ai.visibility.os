import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  JoinedPageRecord,
  PageMetadataRecord,
  ExtractedBusinessContextData,
  ExtractedEntity,
  ExtractedTopic,
  ExtractedProduct,
  ExtractedService,
} from './types';

function getMetadata(page: JoinedPageRecord): PageMetadataRecord | null {
  if (!page.page_metadata) return null;
  if (Array.isArray(page.page_metadata)) {
    return page.page_metadata[0] || null;
  }
  return page.page_metadata;
}

export interface AiSynthesizedSchema {
  industry?: string;
  description?: string;
  valueProposition?: string;
  targetAudience?: string[];
  entities?: Array<{
    name: string;
    entityType?: 'organization' | 'person' | 'brand' | 'location' | 'other';
    description?: string;
  }>;
  topics?: Array<{
    name: string;
    relevanceScore?: number;
  }>;
  products?: Array<{
    name: string;
    description?: string;
    category?: string;
    url?: string;
  }>;
  services?: Array<{
    name: string;
    description?: string;
    category?: string;
    url?: string;
  }>;
}

const businessContextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    industry: {
      type: Type.STRING,
      description: 'Primary industry classification strictly based on content.',
    },
    description: {
      type: Type.STRING,
      description: 'Concise summary description of what the business offers.',
    },
    valueProposition: {
      type: Type.STRING,
      description: 'Core value proposition or key differentiator.',
    },
    targetAudience: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Target customer segments or personas.',
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          entityType: {
            type: Type.STRING,
            enum: ['organization', 'person', 'brand', 'location', 'other'],
          },
          description: { type: Type.STRING },
        },
        required: ['name'],
      },
    },
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          relevanceScore: { type: Type.NUMBER },
        },
        required: ['name'],
      },
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ['name'],
      },
    },
    services: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ['name'],
      },
    },
  },
};

/**
 * Prepares bounded text payload from crawled pages & metadata for Gemini.
 */
export function buildPrioritizedContentPayload(
  pages: JoinedPageRecord[],
  maxCharLength = 30000
): { payloadText: string; primaryPageId: string | null } {
  if (!pages || pages.length === 0) {
    return { payloadText: '', primaryPageId: null };
  }

  const firstPage = pages[0];
  let combinedText = '';

  for (const page of pages) {
    const meta = getMetadata(page);
    const pageSnippet = `
=== PAGE URL: ${page.url} ===
Title: ${meta?.title || 'N/A'}
Meta Description: ${meta?.meta_description || 'N/A'}
Canonical URL: ${meta?.canonical_url || 'N/A'}
Language: ${meta?.language || 'N/A'}
`;
    if (combinedText.length + pageSnippet.length > maxCharLength) {
      break;
    }
    combinedText += pageSnippet;
  }

  return {
    payloadText: combinedText,
    primaryPageId: firstPage?.id ?? null,
  };
}

/**
 * Calls Gemini API to synthesize grounded business context details according to CURRENT database schema.
 */
export async function synthesizeBusinessContextWithAi(
  pages: JoinedPageRecord[],
  apiKey?: string
): Promise<ExtractedBusinessContextData | null> {
  const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeApiKey) {
    console.warn('GEMINI_API_KEY environment variable not set. Skipping AI synthesis pass.');
    return null;
  }

  const { payloadText, primaryPageId } = buildPrioritizedContentPayload(pages);
  if (!payloadText) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: activeApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze the following website crawl data and extract structured business context according to the JSON schema.
              
Strict Grounding Rules:
- Extract ONLY facts directly supported by the text.
- Do NOT infer, fabricate, or assume details not present in the content.
- If a field cannot be determined, omit it or leave empty.

WEBSITE CONTENT:
${payloadText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: businessContextSchema,
      },
    });

    const textOutput = response.text;
    if (!textOutput) return null;

    const parsed: AiSynthesizedSchema = JSON.parse(textOutput);

    const entities: ExtractedEntity[] = (parsed.entities || []).map((e) => ({
      entity_type: e.entityType || 'organization',
      name: e.name.trim(),
      description: e.description?.trim() || null,
      source_page_id: primaryPageId,
      extraction_method: 'ai_assisted',
      confidence_score: 0.85,
    }));

    const topics: ExtractedTopic[] = (parsed.topics || []).map((t) => ({
      name: t.name.trim(),
      relevance_score: typeof t.relevanceScore === 'number' ? t.relevanceScore : 0.8,
      source_page_id: primaryPageId,
      extraction_method: 'ai_assisted',
    }));

    const products: ExtractedProduct[] = (parsed.products || []).map((p) => ({
      name: p.name.trim(),
      description: p.description?.trim() || null,
      category: p.category?.trim() || null,
      url: p.url?.trim() || null,
      source_page_id: primaryPageId,
      extraction_method: 'ai_assisted',
      confidence_score: 0.85,
    }));

    const services: ExtractedService[] = (parsed.services || []).map((s) => ({
      name: s.name.trim(),
      description: s.description?.trim() || null,
      category: s.category?.trim() || null,
      url: s.url?.trim() || null,
      source_page_id: primaryPageId,
      extraction_method: 'ai_assisted',
      confidence_score: 0.85,
    }));

    return {
      industry: parsed.industry?.trim() || null,
      description: parsed.description?.trim() || null,
      value_proposition: parsed.valueProposition?.trim() || null,
      target_audience: Array.isArray(parsed.targetAudience) ? parsed.targetAudience : null,
      confidence_score: 0.85,
      extraction_method: 'ai_assisted',
      entities,
      topics,
      products,
      services,
      technologies: [],
    };
  } catch (err: unknown) {
    console.error('Gemini AI synthesis pass error:', err);
    return null;
  }
}
