import type {
  EstimatedImpact,
  EstimatedEffort,
  PriorityBand,
} from './types';

/**
 * Deterministic Priority Formula & Scoring Module.
 * Calculates explainable impact scores, priority bands, and confidence ratings
 * strictly based on evidence metrics.
 */

/**
 * Computes a normalized impact score (0-100) from evidence metrics.
 */
export function computeImpactScore(
  baseImpact: number,
  evidenceCount: number,
  hasCompetitorAdvantage: boolean
): number {
  const recurrenceBonus = Math.min(30, evidenceCount * 5);
  const competitorBonus = hasCompetitorAdvantage ? 15 : 0;
  const rawScore = baseImpact + recurrenceBonus + competitorBonus;
  return Math.min(100, Math.max(10, Math.round(rawScore)));
}

/**
 * Categorizes an impact score into a standard impact band.
 */
export function determineImpactBand(impactScore: number): EstimatedImpact {
  if (impactScore >= 70) return 'high';
  if (impactScore >= 40) return 'medium';
  return 'low';
}

/**
 * Fixed deterministic lookup table mapping Impact + Effort to Priority Band.
 */
export function determinePriorityBand(
  impact: EstimatedImpact,
  effort: EstimatedEffort
): PriorityBand {
  const matrix: Record<EstimatedImpact, Record<EstimatedEffort, PriorityBand>> = {
    high: {
      quick_win: 'critical',
      moderate: 'critical',
      significant: 'high',
    },
    medium: {
      quick_win: 'high',
      moderate: 'medium',
      significant: 'medium',
    },
    low: {
      quick_win: 'medium',
      moderate: 'low',
      significant: 'low',
    },
  };

  return matrix[impact][effort];
}

/**
 * Calculates a confidence score (0.00 to 1.00) based on evidence density.
 */
export function computeConfidenceScore(evidenceCount: number): number {
  const score = Math.min(1.0, 0.6 + Math.max(1, evidenceCount) * 0.08);
  return Number(score.toFixed(2));
}
