import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runBusinessContextPipeline, type BusinessContextPipelineResult } from '@ai-visibility-os/context';
import type { JobRow } from './management';

/**
 * Server-side function executing the Business Context Engine background job.
 * Reuses the existing runBusinessContextPipeline from @ai-visibility-os/context.
 */
export async function runBusinessContextJob(
  supabase: SupabaseClient<Database>,
  job: JobRow
): Promise<BusinessContextPipelineResult> {
  const result = await runBusinessContextPipeline(supabase, {
    projectId: job.project_id,
    jobId: job.id,
  });

  if (result.status === 'failed') {
    throw new Error(result.error || 'Business Context pipeline execution failed.');
  }

  return result;
}
