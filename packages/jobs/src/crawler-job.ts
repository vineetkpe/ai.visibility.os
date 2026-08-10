import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runDiscoveryPipeline, type CrawlPipelineResult } from '@ai-visibility-os/crawler';
import type { JobRow } from './management';

/**
 * Server-side function executing the Website Discovery Crawler background job.
 * Reuses the existing runDiscoveryPipeline from @ai-visibility-os/crawler.
 */
export async function runCrawlerJob(
  supabase: SupabaseClient<Database>,
  job: JobRow
): Promise<CrawlPipelineResult> {
  const progressObj = (job.progress as Record<string, unknown>) || {};
  const domainId =
    (typeof progressObj.domain_id === 'string' ? progressObj.domain_id : undefined) || job.resource_id;

  if (!domainId) {
    throw new Error('Crawler job requires a valid resource_id or domain_id in progress.');
  }

  // Fetch domain host
  const { data: domain, error: domainErr } = await supabase
    .from('domains')
    .select('host')
    .eq('id', domainId)
    .single();

  if (domainErr || !domain) {
    throw new Error(`Domain record not found: ${domainId}`);
  }

  const result = await runDiscoveryPipeline(supabase, {
    domainId,
    domainName: domain.host,
    jobId: job.id,
  });

  if (result.status === 'failed') {
    throw new Error(result.error || 'Crawler pipeline execution failed.');
  }

  return result;
}
