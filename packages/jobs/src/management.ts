import type { SupabaseClient, Database } from '@ai-visibility-os/database';

export type JobRow = Database['public']['Tables']['jobs']['Row'];

export interface ClaimJobOptions {
  jobType?: string;
  projectId?: string;
}

/**
 * Atomically claims the next queued job using the PostgreSQL claim_next_job RPC function.
 * Uses FOR UPDATE SKIP LOCKED via RPC to prevent double execution.
 * Exhausted queued jobs are marked failed and skipped so one broken job cannot
 * starve the entire production queue.
 */
export async function claimNextJob(
  supabase: SupabaseClient<Database>,
  options?: ClaimJobOptions
): Promise<JobRow | null> {
  const p_job_type = options?.jobType ?? null;
  const p_project_id = options?.projectId ?? null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabase.rpc('claim_next_job', {
      p_job_type,
      p_project_id,
    });

    if (error) {
      console.error('Failed to claim next job:', error.message);
      throw new Error(`claimNextJob RPC error: ${error.message}`);
    }

    if (!data || data.length === 0) return null;

    const job = data[0];
    if (!job) return null;

    if (job.retry_count >= job.max_retries) {
      await failJob(
        supabase,
        job.id,
        job.error_message || 'Job exceeded maximum retries and was skipped.'
      );
      continue;
    }

    return job;
  }

  return null;
}

/**
 * Transitions a running job to 'completed' status and records completion time and optional progress.
 */
export async function completeJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  progress?: Record<string, unknown>
): Promise<JobRow> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: now,
      error_message: null,
      ...(progress ? { progress: progress as Database['public']['Tables']['jobs']['Update']['progress'] } : {}),
      updated_at: now,
    })
    .eq('id', jobId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`completeJob error: ${error?.message || 'Failed to update job to completed.'}`);
  }

  return data;
}

/**
 * Transitions a running job to 'failed' status and records the failure message and completion time.
 * Guaranteed to never persist an empty error string.
 */
export async function failJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  errorMessage: string
): Promise<JobRow> {
  const now = new Date().toISOString();
  const safeErrorMessage = errorMessage && errorMessage.trim().length > 0
    ? errorMessage.trim()
    : 'Job failed with an unknown error.';

  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'failed',
      completed_at: now,
      error_message: safeErrorMessage,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`failJob error: ${error?.message || 'Failed to update job to failed.'}`);
  }

  return data;
}

/**
 * Retries a failed or erroring job if retry_count < max_retries by setting status back to 'queued'.
 * If max_retries is reached, marks the job as 'failed'.
 */
export async function retryJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  errorMessage: string
): Promise<JobRow> {
  const { data: existingJob, error: fetchErr } = await supabase
    .from('jobs')
    .select('retry_count, max_retries')
    .eq('id', jobId)
    .single();

  if (fetchErr || !existingJob) {
    return failJob(supabase, jobId, errorMessage);
  }

  const safeErrorMessage = errorMessage && errorMessage.trim().length > 0
    ? errorMessage.trim()
    : 'Job execution error.';

  if (existingJob.retry_count < existingJob.max_retries) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status: 'queued',
        retry_count: existingJob.retry_count + 1,
        started_at: null,
        error_message: safeErrorMessage,
        updated_at: now,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error || !data) {
      return failJob(supabase, jobId, errorMessage);
    }

    return data;
  }

  return failJob(supabase, jobId, safeErrorMessage);
}
