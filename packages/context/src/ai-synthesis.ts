import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { ExtractedField, PageRecord } from './types';

export interface AiSynthesizedResult {
  description?: string;
  industry?: string;
  subIndustry?: string;
  products?: string[];
  services?: string[];
  targetAudience?: string[];
  pricingModel?: string;
  topics?: string[];
  brandKeywords?: string[];
  trustSignals?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

const businessContextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: 'Concise, literal description of what the company does based solely on the text.',
    },
    industry: {
      type: Type.STRING,
      description: 'Primary industry classification explicitly supported by the content.',
    },
    subIndustry: {
      type: Type.STRING,
      description: 'Sub-industry or niche classification supported by the content.',
    },
    products: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific software, physical products, or goods offered.',
    },
    services: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Professional or technical services offered by the business.',
    },
    targetAudience: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Target customer personas, business types, or market segments.',
    },
    pricingModel: {
      type: Type.STRING,
      description: 'Pricing model explicitly mentioned (e.g., Subscription, Freemium, Custom Enterprise Quote).',
    },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Core subject matter themes and expertise topics.',
    },
    brandKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Primary brand names, trademark terms, and core industry keywords.',
    },
    trustSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Certifications, security badges, awards, or customer counts explicitly stated.',
    },
    faq: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ['question', 'answer'],
      },
      description: 'Frequently asked questions and answers found in the body text.',
    },
  },
};

/**
 * Prepares a prioritized, bounded text payload from crawled pages for Gemini analysis.
 */
export function buildPrioritizedContentPayload(
  pages: PageRecord[],
  maxCharLength = 30000
): { payloadText: string; primaryPageId: string | null } {
  if (!pages || pages.length === 0) {
    return { payloadText: '', primaryPageId: null };
  }

  const primaryPage = pages[0] as PageRecord;
  let combinedText = '';

  for (const page of pages) {
    const pageSnippet = `
=== PAGE URL: ${page.url} ===
Title: ${page.title || 'N/A'}
Meta Description: ${page.meta_description || 'N/A'}
Headings: ${page.headings ? JSON.stringify(page.headings) : 'N/A'}
`;
    if (combinedText.length + pageSnippet.length > maxCharLength) {
      break;
    }
    combinedText += pageSnippet;
  }

  return {
    payloadText: combinedText,
    primaryPageId: primaryPage.id,
  };
}

/**
 * Calls Gemini API to synthesize grounded business context fields from text payload.
 */
export async function synthesizeBusinessContextWithAi(
  pages: PageRecord[],
  apiKey?: string
): Promise<ExtractedField[]> {
  const fields: ExtractedField[] = [];
  const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeApiKey) {
    console.warn('GEMINI_API_KEY environment variable not set. Skipping AI synthesis pass.');
    return fields;
  }

  const { payloadText, primaryPageId } = buildPrioritizedContentPayload(pages);
  if (!payloadText) return fields;

  try {
    const ai = new GoogleGenAI({ apiKey: activeApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze the following website content and extract structured business context details according to the JSON schema.
              
Strict Grounding Rules:
- Extract ONLY facts directly supported by the text.
- Do NOT infer, fabricate, or assume details not present in the content.
- If a field cannot be determined from the content, leave it empty or omitted.

WEBSITE CONTENT:
${payloadText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: businessContextSchema,
        temperature: 0.1,
      },
    });

    const textOutput = response.text;
    if (!textOutput) return fields;

    const parsed: AiSynthesizedResult = JSON.parse(textOutput);

    const pushField = (fieldName: string, value?: string, confidence = 0.70) => {
      if (value && value.trim()) {
        fields.push({
          fieldName,
          fieldValue: value.trim(),
          confidenceScore: confidence,
          sourcePageId: primaryPageId,
          extractionMethod: 'ai_inferred',
        });
      }
    };

    const pushArrayFields = (fieldName: string, arr?: string[], confidence = 0.65) => {
      if (Array.isArray(arr)) {
        arr.forEach((v) => pushField(fieldName, v, confidence));
      }
    };

    pushField('description', parsed.description, 0.75);
    pushField('industry', parsed.industry, 0.70);
    pushField('subIndustry', parsed.subIndustry, 0.65);
    pushField('pricingModel', parsed.pricingModel, 0.65);

    pushArrayFields('products', parsed.products, 0.70);
    pushArrayFields('services', parsed.services, 0.70);
    pushArrayFields('targetAudience', parsed.targetAudience, 0.65);
    pushArrayFields('topics', parsed.topics, 0.65);
    pushArrayFields('brandKeywords', parsed.brandKeywords, 0.65);
    pushArrayFields('trustSignals', parsed.trustSignals, 0.70);

    if (Array.isArray(parsed.faq)) {
      parsed.faq.forEach((item) => {
        if (item.question && item.answer) {
          pushField('faq', `Q: ${item.question} | A: ${item.answer}`, 0.70);
        }
      });
    }

    return fields;
  } catch (err: unknown) {
    console.error('Gemini AI synthesis pass encountered an error:', err);
    return fields;
  }
}
