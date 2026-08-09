import type { RecommendationPriority } from './types';

/**
 * Deterministic Priority Formula & Scoring Module.
 * Computes 1..5 impact and effort scores and derives valid recommendation_priority enum values.
 */

/**
 * Clamps a raw score to the valid 1..5 range required by database check constraints.
 */
export function clampScore(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score)));
}

/**
 * Computes a 1..5 impact score based on base weight and evidence count.
 */
export function computeImpactScore(baseWeight: number, evidenceCount: number): number {
  const recurrenceBonus = Math.min(2, Math.floor(evidenceCount / 2));
  return clampScore(baseWeight + recurrenceBonus);
}

/**
 * Derives recommendation_priority enum from impact and effort scores.
 */
export function determinePriority(impactScore: number, effortScore: number): RecommendationPriority {
  const impact = clampScore(impactScore);
  const effort = clampScore(effortScore);

  if (impact >= 4 && effort <= 2) return 'critical';
  if (impact >= 4) return 'high';
  if (impact >= 3 && effort <= 3) return 'medium';
  if (impact <= 2) return 'low';

  return 'medium';
}
