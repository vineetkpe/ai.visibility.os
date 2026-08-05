import { task } from '@trigger.dev/sdk/v3';
import { runBusinessContextPipeline } from '@ai-visibility-os/context';
import { createServerClient } from '@ai-visibility-os/database';

export interface BusinessContextTaskPayload {
  projectId: string;
}

/**
 * Trigger.dev background task wrapping the Business Context Engine synthesis pipeline.
 */
export const businessContextTask = task({
  id: 'business-context-synthesis',
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: BusinessContextTaskPayload) => {
    const supabase = createServerClient({
      getAll: () => [],
    });

    const result = await runBusinessContextPipeline(supabase, {
      projectId: payload.projectId,
    });

    return result;
  },
});
