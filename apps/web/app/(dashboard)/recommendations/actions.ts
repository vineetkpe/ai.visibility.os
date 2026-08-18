'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runRecommendationEngine, getProjectRecommendations, updateRecommendationStatus, type Recommendation, type RecommendationPriority, type RecommendationStatus, type RecommendationEngineRunResult } from '@ai-visibility-os/recommendations';

export interface ActionResult<T> { success: boolean; data?: T; error?: string; }

async function verifyProjectOwnership(supabase: SupabaseClient<Database>, projectId: string) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Authentication required. Please sign in.');
  const { data: project, error: projErr } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single();
  if (projErr || !project) throw new Error('Project not found or access denied.');
  return user;
}

/** Runs the deterministic recommendation engine once. The worker queue is reserved for scheduled jobs. */
export async function generateRecommendationsAction(projectId: string): Promise<ActionResult<RecommendationEngineRunResult>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);

    const { data: completedScans, error: scanErr } = await supabase.from('ai_scans').select('id').eq('project_id', projectId).eq('status', 'completed').limit(1);
    if (scanErr) return { success: false, error: scanErr.message };
    if (!completedScans?.length) return { success: false, error: 'Recommendation Engine requires at least one completed AI Visibility scan. Please run a scan first.' };

    const { data: bcVersions, error: bcErr } = await supabase.from('business_context_versions').select('id').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1);
    if (bcErr) return { success: false, error: bcErr.message };
    if (!bcVersions?.length) return { success: false, error: 'Recommendation Engine requires a completed Business Context version. Please extract business context first.' };

    const result = await runRecommendationEngine(supabase, projectId);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to generate recommendations.' };
  }
}

export async function getRecommendationsOverviewAction(projectId: string, filter?: { status?: RecommendationStatus; category?: string; priority?: RecommendationPriority }): Promise<ActionResult<Recommendation[]>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);
    return { success: true, data: await getProjectRecommendations(supabase, projectId, filter) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch recommendations.' };
  }
}

export async function updateRecommendationStatusAction(input: { projectId: string; recommendationId: string; status: RecommendationStatus }): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);
    return { success: true, data: await updateRecommendationStatus(supabase, input.recommendationId, input.status) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update recommendation status.' };
  }
}
