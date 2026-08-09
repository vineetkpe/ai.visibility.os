'use server';

import { createClient } from '@/lib/supabase/server';
import { siteCrawlTask } from '@ai-visibility-os/jobs';

export interface CrawlActionResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * Initiates a website discovery crawl after verifying domain ownership for the authenticated user.
 */
export async function startSiteCrawlAction(domainId: string): Promise<CrawlActionResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate User & Fetch Session Token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return { success: false, error: 'Session expired, please log in again.' };
    }

    const user = session.user;

    // 2. Server-Side Domain Ownership Verification (scoped via auth.uid())
    const { data: userProjects, error: fetchProjectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (fetchProjectsError || !userProjects || userProjects.length === 0) {
      return { success: false, error: 'Access denied. No active project found for user.' };
    }

    const projectIds = userProjects.map((p) => p.id);

    const { data: domain, error: domainFetchError } = await supabase
      .from('domains')
      .select('id, host, project_id')
      .eq('id', domainId)
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .single();

    if (domainFetchError || !domain) {
      return { success: false, error: 'Domain not found or access denied.' };
    }

    // 3. Create job record in queued state
    const { data: job, error: jobInsertError } = await supabase
      .from('jobs')
      .insert({
        project_id: domain.project_id,
        job_type: 'site_crawl',
        status: 'queued',
        resource_type: 'domain',
        resource_id: domain.id,
      })
      .select('id')
      .single();

    if (jobInsertError || !job) {
      return { success: false, error: jobInsertError?.message || 'Failed to create crawl job.' };
    }

    // 4. Trigger Trigger.dev task on background infrastructure
    try {
      const handle = await siteCrawlTask.trigger({
        domainId: domain.id,
        domainName: domain.host,
        jobId: job.id,
        accessToken: session.access_token,
      });
      await supabase.from('jobs').update({ trigger_run_id: handle.id }).eq('id', job.id);
    } catch (triggerErr: unknown) {
      const message = triggerErr instanceof Error ? triggerErr.message : String(triggerErr);
      const errorMessage = `Failed to start background job: ${message}`;
      console.warn('Trigger.dev dispatch warning:', triggerErr);
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', job.id);
      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      jobId: job.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
