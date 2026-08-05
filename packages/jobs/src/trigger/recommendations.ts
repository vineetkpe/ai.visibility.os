import { task } from '@trigger.dev/sdk/v3';
import { runRecommendationEngine } from '@ai-visibility-os/recommendations';
import { createServerClient } from '@ai-visibility-os/database';

export interface RecommendationsTaskPayload {
  projectId: string;
}

/**
 * Trigger.dev background task wrapping the AI Recommendation Engine pipeline.
 * Gated on project having at least one completed scan and a completed business context version.
 */
export const recommendationsTask = task({
  id: 'ai-recommendations-engine',
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: RecommendationsTaskPayload) => {
    const supabase = createServerClient({
      getAll: () => [],
    });

    // 1. Verify project has at least 1 completed scan
    const { data: completedScans, error: scanErr } = await supabase
      .from('scans')
      .select('id')
      .eq('project_id', payload.projectId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .limit(1);

    if (scanErr || !completedScans || completedScans.length === 0) {
      throw new Error(
        'Recommendation Engine requires at least one completed AI Visibility scan for the project.'
      );
    }

    // 2. Verify project has a completed business context version
    const { data: bcVersions, error: bcErr } = await supabase
      .from('business_context_versions')
      .select('id')
      .eq('project_id', payload.projectId)
      .eq('is_current', true)
      .limit(1);

    if (bcErr || !bcVersions || bcVersions.length === 0) {
      throw new Error(
        'Recommendation Engine requires a completed Business Context version for the project.'
      );
    }

    // 3. Execute Recommendation Engine Pipeline
    const result = await runRecommendationEngine(supabase, payload.projectId);

    return result;
  },
});
