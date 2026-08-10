import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runVisibilityScanPipeline, type VisibilityScanPipelineResult } from '@ai-visibility-os/scanner';
import type { JobRow } from './management';

/**
 * Server-side function executing the AI Visibility Scanner background job.
 * Reuses the existing runVisibilityScanPipeline from @ai-visibility-os/scanner.
 */
export async function runScannerJob(
  supabase: SupabaseClient<Database>,
  job: JobRow
): Promise<VisibilityScanPipelineResult> {
  const result = await runVisibilityScanPipeline(supabase, {
    projectId: job.project_id,
    jobId: job.id,
  });

  if (result.status === 'failed') {
    throw new Error(result.error || 'Visibility scan pipeline execution failed.');
  }

  return result;
}
