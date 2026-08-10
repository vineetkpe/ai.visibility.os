'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import {
  runRecommendationEngine,
  getProjectRecommendations,
  updateRecommendationStatus,
  type Recommendation,
  type RecommendationPriority,
  type RecommendationStatus,
  type RecommendationEngineRunResult,
} from '@ai-visibility-os/recommendations';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to verify user ownership of a target project using auth.uid() scoping.
 */
async function verifyProjectOwnership(supabase: SupabaseClient<Database>, projectId: string) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Authentication required. Please sign in.');
  }

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projErr || !project) {
    throw new Error('Project not found or access denied.');
  }

  return user;
}

/**
 * Server action to manually trigger the AI Recommendation Engine.
 * Gated on project having at least 1 completed scan and 1 completed business context version.
 */
export async function generateRecommendationsAction(
  projectId: string
): Promise<ActionResult<RecommendationEngineRunResult>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);

    // 1. Verify Gating - Completed Scan
    const { data: completedScans, error: scanErr } = await supabase
      .from('ai_scans')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .limit(1);

    if (scanErr || !completedScans || completedScans.length === 0) {
      return {
        success: false,
        error:
          'Recommendation Engine requires at least one completed AI Visibility scan. Please run a scan first.',
      };
    }

    // 2. Verify Gating - Completed Business Context
    const { data: bcVersions, error: bcErr } = await supabase
      .from('business_context_versions')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (bcErr || !bcVersions || bcVersions.length === 0) {
      return {
        success: false,
        error:
          'Recommendation Engine requires a completed Business Context version. Please extract business context first.',
      };
    }

    // 3. Enqueue job into internal jobs queue for worker processing
    const { data: jobRow, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        project_id: projectId,
        job_type: 'recommendations',
        status: 'queued',
      })
      .select('*')
      .single();

    if (jobErr || !jobRow) {
      const errorMessage = `Failed to enqueue recommendation job: ${jobErr?.message || 'Unknown database error'}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    // 4. Run engine synchronously for immediate UI feedback
    const result = await runRecommendationEngine(supabase, projectId);

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate recommendations.';
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch recommendations list for a project with optional filters.
 */
export async function getRecommendationsOverviewAction(
  projectId: string,
  filter?: {
    status?: RecommendationStatus;
    category?: string;
    priority?: RecommendationPriority;
  }
): Promise<ActionResult<Recommendation[]>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);

    const recs = await getProjectRecommendations(supabase, projectId, filter);
    return { success: true, data: recs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch recommendations.';
    return { success: false, error: message };
  }
}

/**
 * Server action to update recommendation status (e.g. open -> in_progress -> resolved / dismissed).
 */
export async function updateRecommendationStatusAction(input: {
  projectId: string;
  recommendationId: string;
  status: RecommendationStatus;
}): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);

    const updated = await updateRecommendationStatus(
      supabase,
      input.recommendationId,
      input.status
    );

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update recommendation status.';
    return { success: false, error: message };
  }
}
