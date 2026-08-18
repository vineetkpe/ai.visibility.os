'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@ai-visibility-os/database';
import { runDiscoveryPipeline } from '@ai-visibility-os/crawler';

export interface CrawlActionResult { success: boolean; jobId?: string; error?: string; }

/** Starts a crawl immediately. Scheduled worker execution remains available for retries. */
export async function startSiteCrawlAction(domainId: string): Promise<CrawlActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: 'Session expired, please log in again.' };

    const { data: domain, error: domainError } = await supabase.from('domains').select('id, host, project_id').eq('id', domainId).is('deleted_at', null).maybeSingle();
    if (domainError || !domain) return { success: false, error: 'Domain not found.' };
    const { data: project } = await supabase.from('projects').select('id').eq('id', domain.project_id).eq('user_id', user.id).is('deleted_at', null).maybeSingle();
    if (!project) return { success: false, error: 'Domain access denied.' };

    const { data: job, error: jobInsertError } = await supabase.from('jobs').insert({ project_id: project.id, job_type: 'site_crawl', status: 'queued', resource_type: 'domain', resource_id: domain.id }).select('id').single();
    if (jobInsertError || !job) return { success: false, error: jobInsertError?.message || 'Failed to create crawl job.' };

    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) return { success: false, error: 'Server crawl configuration is incomplete.' };
    const serviceClient = createServiceClient(secret);
    const result = await runDiscoveryPipeline(serviceClient, { domainId: domain.id, domainName: domain.host, jobId: job.id });
    if (result.status === 'failed') return { success: false, jobId: job.id, error: result.error || 'Website crawl failed.' };
    return { success: true, jobId: job.id };
  } catch (err: unknown) { return { success: false, error: err instanceof Error ? err.message : 'An unexpected crawl error occurred.' }; }
}
