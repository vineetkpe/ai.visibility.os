import { task } from '@trigger.dev/sdk/v3';
import { runDiscoveryPipeline } from '@ai-visibility-os/crawler';
import { createServerClient, createTokenClient } from '@ai-visibility-os/database';

export interface SiteCrawlTaskPayload {
  domainId: string;
  domainName: string;
  jobId: string;
  accessToken?: string;
}

/**
 * Trigger.dev background task wrapping website discovery crawl pipeline.
 */
export const siteCrawlTask = task({
  id: 'site-crawl',
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload: SiteCrawlTaskPayload) => {
    // Instantiate token-authenticated Supabase client (or cookieless fallback) for background task
    const supabase = payload.accessToken
      ? createTokenClient(payload.accessToken)
      : createServerClient({ getAll: () => [] });

    const result = await runDiscoveryPipeline(supabase, {
      domainId: payload.domainId,
      domainName: payload.domainName,
      jobId: payload.jobId,
    });

    return result;
  },
});
