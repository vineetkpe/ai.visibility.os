import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { syncCompetitorTier1Data } from '@ai-visibility-os/competitor';
import { runDiscoveryPipeline, type CrawlPipelineResult } from '@ai-visibility-os/crawler';
import type { JobRow } from './management';

export interface CompetitorJobResult {
  competitorId?: string;
  updatedCitationsCount?: number;
  scansProcessedCount?: number;
  crawlResult?: CrawlPipelineResult;
}

/**
 * Server-side function executing background jobs for tracked competitors.
 * Performs Tier 1 citation syncing and competitor domain discovery crawl if requested.
 */
export async function runCompetitorJob(
  supabase: SupabaseClient<Database>,
  job: JobRow
): Promise<CompetitorJobResult> {
  const progressObj = (job.progress as Record<string, unknown>) || {};
  const competitorId =
    job.resource_id || (typeof progressObj.competitor_id === 'string' ? progressObj.competitor_id : undefined);

  if (!competitorId) {
    throw new Error('Competitor job requires a valid resource_id or competitor_id in progress.');
  }

  // 1. Synchronize Tier 1 citation matches for the competitor
  const syncResult = await syncCompetitorTier1Data(supabase, competitorId);

  // 2. If the job is a site crawl for the competitor's domain, execute discovery pipeline
  let crawlResult: CrawlPipelineResult | undefined;
  const domainId = typeof progressObj.domain_id === 'string' ? progressObj.domain_id : undefined;
  const domainName = typeof progressObj.domain_name === 'string' ? progressObj.domain_name : 'example.com';

  if (job.job_type === 'site_crawl' && domainId) {
    crawlResult = await runDiscoveryPipeline(supabase, {
      domainId,
      domainName,
      jobId: job.id,
    });
  }

  return {
    competitorId,
    updatedCitationsCount: syncResult.updatedCitationsCount,
    scansProcessedCount: syncResult.scansProcessedCount,
    crawlResult,
  };
}
