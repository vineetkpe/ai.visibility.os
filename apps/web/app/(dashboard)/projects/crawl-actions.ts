'use server';

import { createClient } from '@/lib/supabase/server';
import { runDiscoveryPipeline } from '@ai-visibility-os/crawler';

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

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

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
      .select('id, domain_name, project_id')
      .eq('id', domainId)
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .single();

    if (domainFetchError || !domain) {
      return { success: false, error: 'Domain not found or access denied.' };
    }

    // 3. Create job record in pending state
    const { data: job, error: jobInsertError } = await supabase
      .from('jobs')
      .insert({
        project_id: domain.project_id,
        job_type: 'site_crawl',
        status: 'pending',
        payload: { domain_id: domain.id, domain_name: domain.domain_name },
      })
      .select('id')
      .single();

    if (jobInsertError || !job) {
      return { success: false, error: jobInsertError?.message || 'Failed to create crawl job.' };
    }

    // 4. Enqueue and execute discovery pipeline background task
    // (Asynchronously run discovery pipeline in background)
    void (async () => {
      try {
        const bgSupabase = await createClient();
        await runDiscoveryPipeline(bgSupabase, {
          domainId: domain.id,
          domainName: domain.domain_name,
          jobId: job.id,
        });
      } catch (err: unknown) {
        console.error('Background crawl pipeline error:', err);
      }
    })();

    return {
      success: true,
      jobId: job.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
