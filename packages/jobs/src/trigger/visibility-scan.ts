import { task } from '@trigger.dev/sdk/v3';
import { runVisibilityScanPipeline } from '@ai-visibility-os/scanner';
import { createServerClient, createTokenClient } from '@ai-visibility-os/database';

export interface VisibilityScanTaskPayload {
  projectId: string;
  jobId?: string;
  accessToken?: string;
  targetDomainName?: string;
}

/**
 * Trigger.dev background task wrapping AI Visibility Engine scan pipeline.
 */
export const visibilityScanTask = task({
  id: 'ai-visibility-scan',
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: VisibilityScanTaskPayload) => {
    const supabase = payload.accessToken
      ? createTokenClient(payload.accessToken)
      : createServerClient({ getAll: () => [] });

    const result = await runVisibilityScanPipeline(supabase, {
      projectId: payload.projectId,
      jobId: payload.jobId,
      targetDomainName: payload.targetDomainName,
    });

    return result;
  },
});
