'use server';

import { createClient } from '@/lib/supabase/server';
import { businessContextTask } from '@ai-visibility-os/jobs';

export interface BusinessContextActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to manually initiate Business Context Engine generation for a project.
 * Verification requirement: Scoped via auth.uid() and requires the project's most recent site_crawl job status to be 'completed'.
 */
export async function generateBusinessContextAction(
  projectId: string
): Promise<BusinessContextActionResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Verify project ownership scoped via auth.uid()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    // 3. Verify that the project's most recent site_crawl job status is 'completed'
    const { data: latestCrawlJobs, error: jobCheckError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('job_type', 'site_crawl')
      .order('created_at', { ascending: false })
      .limit(1);

    if (jobCheckError) {
      return { success: false, error: jobCheckError.message };
    }

    const latestJob = latestCrawlJobs?.[0];
    if (!latestJob || latestJob.status !== 'completed') {
      return {
        success: false,
        error:
          'Business Context generation is enabled only after a website discovery crawl job has completed successfully.',
      };
    }

    // 4. Create pending job record
    const { data: job, error: jobInsertError } = await supabase
      .from('jobs')
      .insert({
        project_id: project.id,
        job_type: 'business_context',
        status: 'pending',
        payload: { project_id: project.id },
      })
      .select('id')
      .single();

    if (jobInsertError || !job) {
      return {
        success: false,
        error: jobInsertError?.message || 'Failed to create business context job record.',
      };
    }

    // 5. Dispatch Trigger.dev task on background infrastructure
    try {
      const handle = await businessContextTask.trigger({
        projectId: project.id,
      });
      await supabase.from('jobs').update({ trigger_run_id: handle.id }).eq('id', job.id);
    } catch (triggerErr: unknown) {
      const message = triggerErr instanceof Error ? triggerErr.message : String(triggerErr);
      const errorMessage = `Failed to start background job: ${message}`;
      console.warn('Trigger.dev business context task dispatch warning:', triggerErr);
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
