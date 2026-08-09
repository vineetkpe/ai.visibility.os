import { GoogleGenAI } from '@google/genai';
import type { DetectedIssue, ExtractionMethod } from './types';

export interface PhrasedRecommendation {
  title: string;
  description: string;
  generationMethod: ExtractionMethod;
}

/**
 * Gemini Natural Language Phrasing Pass.
 * Rephrases detected issues into crisp, executive-ready title and description,
 * strictly grounded ONLY in the provided evidence.
 */
export async function phraseRecommendationWithGemini(
  issue: DetectedIssue
): Promise<PhrasedRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      title: issue.title,
      description: issue.description,
      generationMethod: 'deterministic',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const evidenceText = issue.evidence
      .map((e, idx) => `${idx + 1}. ${e.notes || 'Evidence record'}`)
      .join('\n');

    const prompt = `Rephrase the following detected recommendation into executive-ready language.

Detected Title: ${issue.title}
Detected Category: ${issue.category}
Detected Description: ${issue.description}
Evidence Collected:
${evidenceText}

STRICT RULES:
1. Ground every sentence ONLY in the evidence provided above.
2. Do NOT invent new statistics, ranking promises, or ungrounded claims.
3. Return valid JSON matching the following schema exactly:
{
  "title": "Clear action title",
  "description": "Crisp executive summary explaining why this issue was detected and how to resolve it"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You are an AI Search Visibility Copywriter. Rephrase detected issues into executive-ready language strictly grounded in the provided evidence. Never invent ungrounded claims.',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.title === 'string' && typeof parsed.description === 'string') {
        return {
          title: parsed.title,
          description: parsed.description,
          generationMethod: 'ai_assisted',
        };
      }
    }
  } catch (err) {
    console.warn('Gemini phrasing notice (falling back to deterministic template):', err);
  }

  return {
    title: issue.title,
    description: issue.description,
    generationMethod: 'deterministic',
  };
}
