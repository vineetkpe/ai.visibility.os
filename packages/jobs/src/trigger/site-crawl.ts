import { task } from '@trigger.dev/sdk/v3';
import { runDiscoveryPipeline } from '@ai-visibility-os/crawler';
import { createServerClient } from '@ai-visibility-os/database';

export interface SiteCrawlTaskPayload {
  domainId: string;
  domainName: string;
  jobId: string;
}

/**
 * Trigger.dev background task wrapping website discovery crawl pipeline.
 */
export const siteCrawlTask = task({
  id: 'site-crawl',
  run: async (payload: SiteCrawlTaskPayload) => {
    // Instantiate server Supabase client with empty cookie context for background task
    const supabase = createServerClient({
      getAll: () => [],
    });

    const result = await runDiscoveryPipeline(supabase, {
      domainId: payload.domainId,
      domainName: payload.domainName,
      jobId: payload.jobId,
    });

    return result;
  },
});
