import { GoogleGenAI } from '@google/genai';
import type { DetectedIssue, GenerationMethod } from './types';

export interface PhrasedRecommendation {
  title: string;
  summary: string;
  implementationSteps: string[];
  generationMethod: GenerationMethod;
}

/**
 * Gemini Natural Language Phrasing Pass.
 * Rephrases detected technical issues into crisp, executive-ready language,
 * strictly grounded ONLY in the provided evidence.
 */
export async function phraseRecommendationWithGemini(
  issue: DetectedIssue
): Promise<PhrasedRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      title: issue.title,
      summary: issue.summary,
      implementationSteps: issue.implementationSteps,
      generationMethod: 'deterministic',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const evidenceText = issue.evidence.map((e, idx) => `${idx + 1}. ${e.description}`).join('\n');

    const prompt = `Rephrase the following detected technical recommendation into executive-ready language.

Detected Title: ${issue.title}
Detected Category: ${issue.category}
Detected Summary: ${issue.summary}
Evidence Collected:
${evidenceText}

Implementation Steps Input:
${issue.implementationSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

STRICT RULES:
1. Ground every sentence ONLY in the evidence provided above.
2. Do NOT invent new statistics, ranking promises, or ungrounded claims.
3. Return valid JSON matching the following schema exactly:
{
  "title": "Clear action title",
  "summary": "Crisp executive summary explaining why this issue was detected",
  "implementationSteps": ["Step 1...", "Step 2...", "Step 3..."]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You are an AI Search Visibility Copywriter. Rephrase detected issues into executive-ready language strictly grounded in the provided evidence. Never invent ungrounded claims or generic SEO advice.',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.title === 'string' && typeof parsed.summary === 'string' && Array.isArray(parsed.implementationSteps)) {
        return {
          title: parsed.title,
          summary: parsed.summary,
          implementationSteps: parsed.implementationSteps,
          generationMethod: 'ai_phrased',
        };
      }
    }
  } catch (err) {
    console.warn('Gemini phrasing notice (falling back to deterministic template):', err);
  }

  return {
    title: issue.title,
    summary: issue.summary,
    implementationSteps: issue.implementationSteps,
    generationMethod: 'deterministic',
  };
}
