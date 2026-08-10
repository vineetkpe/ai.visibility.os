import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runRecommendationEngine, type RecommendationEngineRunResult } from '@ai-visibility-os/recommendations';
import type { JobRow } from './management';

/**
 * Server-side function executing the Recommendation Engine background job.
 * Gated on project having at least 1 completed scan and 1 completed business context version.
 * Idempotent: Deduplicates recommendations by scope_key so retries refresh rather than duplicate.
 */
export async function runRecommendationsJob(
  supabase: SupabaseClient<Database>,
  job: JobRow
): Promise<RecommendationEngineRunResult> {
  const projectId = job.project_id;

  // 1. Verify Gating - Requires at least 1 completed scan
  const { data: completedScans, error: scanErr } = await supabase
    .from('ai_scans')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .limit(1);

  if (scanErr || !completedScans || completedScans.length === 0) {
    throw new Error(
      'Recommendation Engine requires at least one completed AI Visibility scan for the project.'
    );
  }

  // 2. Verify Gating - Requires a completed business context version
  const { data: bcVersions, error: bcErr } = await supabase
    .from('business_context_versions')
    .select('id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (bcErr || !bcVersions || bcVersions.length === 0) {
    throw new Error(
      'Recommendation Engine requires a completed Business Context version for the project.'
    );
  }

  // 3. Execute Recommendation Engine Pipeline
  return await runRecommendationEngine(supabase, projectId);
}
