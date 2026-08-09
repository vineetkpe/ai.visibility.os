'use server';

import { createClient } from '@/lib/supabase/server';
import { visibilityScanTask } from '@ai-visibility-os/jobs';

export interface VisibilityScanActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to manually initiate AI Visibility Engine scanning for a project.
 * Verification requirement: Scoped via auth.uid() and requires an active business context version (is_current = true).
 */
export async function startVisibilityScanAction(
  projectId: string
): Promise<VisibilityScanActionResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user & Fetch Session Token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return { success: false, error: 'Session expired, please log in again.' };
    }

    const user = session.user;

    // 2. Verify project ownership scoped via auth.uid()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    // 3. Gate check: Verify project has a current business context version
    const { data: currentVersions, error: versionCheckError } = await supabase
      .from('business_context_versions')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (versionCheckError) {
      return { success: false, error: versionCheckError.message };
    }

    if (!currentVersions || currentVersions.length === 0) {
      // Check status of recent business_context job for this project to report exact status/error
      const { data: recentContextJobs } = await supabase
        .from('jobs')
        .select('id, status, error_message')
        .eq('project_id', projectId)
        .eq('job_type', 'business_context')
        .order('created_at', { ascending: false })
        .limit(1);

      const latestContextJob = recentContextJobs?.[0];
      if (latestContextJob?.status === 'failed') {
        const errorDetail = latestContextJob.error_message ? `: ${latestContextJob.error_message}` : '.';
        return {
          success: false,
          error: `Business context generation failed because AI synthesis is unavailable${errorDetail}`,
        };
      }

      if (latestContextJob?.status === 'running' || latestContextJob?.status === 'queued') {
        return {
          success: false,
          error: 'Business context generation is currently in progress. Please wait for it to complete.',
        };
      }

      return {
        success: false,
        error:
          'Scan generation requires a current business context. Please generate business context first.',
      };
    }

    // 4. Create pending job record
    const { data: job, error: jobInsertError } = await supabase
      .from('jobs')
      .insert({
        project_id: project.id,
        job_type: 'visibility_scan',
        status: 'queued',
        resource_type: 'project',
        resource_id: project.id,
      })
      .select('id')
      .single();

    if (jobInsertError || !job) {
      return {
        success: false,
        error: jobInsertError?.message || 'Failed to create scan job record.',
      };
    }

    // 5. Dispatch Trigger.dev task on background infrastructure
    try {
      const handle = await visibilityScanTask.trigger({
        projectId: project.id,
        jobId: job.id,
        accessToken: session.access_token,
      });
      await supabase.from('jobs').update({ trigger_run_id: handle.id }).eq('id', job.id);
    } catch (triggerErr: unknown) {
      const message = triggerErr instanceof Error ? triggerErr.message : String(triggerErr);
      const errorMessage = `Failed to start background job: ${message}`;
      console.warn('Trigger.dev visibility scan task dispatch warning:', triggerErr);
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', job.id);
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
