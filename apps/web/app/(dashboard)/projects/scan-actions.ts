'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@ai-visibility-os/database';
import { runVisibilityScanPipeline } from '@ai-visibility-os/scanner';

export interface VisibilityScanActionResult { success: boolean; error?: string; }

/** Starts a scan immediately. The background worker remains available for scheduled/retry jobs. */
export async function startVisibilityScanAction(projectId: string): Promise<VisibilityScanActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: 'Session expired, please log in again.' };

    const { data: project, error: projectError } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).maybeSingle();
    if (projectError || !project) return { success: false, error: 'Project not found or access denied.' };

    const { data: currentVersion, error: versionError } = await supabase.from('business_context_versions').select('id').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (versionError) return { success: false, error: versionError.message };
    if (!currentVersion) {
      const { runBusinessContextPipeline } = await import('@ai-visibility-os/context');
      const contextResult = await runBusinessContextPipeline(supabase, { projectId });
      if (contextResult.status === 'failed' || !contextResult.contextVersionId) return { success: false, error: contextResult.error || 'Unable to prepare business profile for this website.' };
    }

    const { data: job, error: jobInsertError } = await supabase.from('jobs').insert({ project_id: project.id, job_type: 'visibility_scan', status: 'queued', resource_type: 'project', resource_id: project.id }).select('id').single();
    if (jobInsertError || !job) return { success: false, error: jobInsertError?.message || 'Failed to create scan job record.' };

    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) return { success: false, error: 'Server scan configuration is incomplete.' };
    const serviceClient = createServiceClient(secret);
    const result = await runVisibilityScanPipeline(serviceClient, { projectId, jobId: job.id });
    if (result.status === 'failed') return { success: false, error: result.error || 'Visibility scan failed.' };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'An unexpected scan error occurred.' };
  }
}
