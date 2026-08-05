import { task } from '@trigger.dev/sdk/v3';
import { runVisibilityScanPipeline } from '@ai-visibility-os/scanner';
import { createServerClient } from '@ai-visibility-os/database';

export interface VisibilityScanTaskPayload {
  projectId: string;
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
    const supabase = createServerClient({
      getAll: () => [],
    });

    const result = await runVisibilityScanPipeline(supabase, {
      projectId: payload.projectId,
      targetDomainName: payload.targetDomainName,
    });

    return result;
  },
});
