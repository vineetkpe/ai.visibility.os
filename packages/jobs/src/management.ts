import type { SupabaseClient, Database } from '@ai-visibility-os/database';

export type JobRow = Database['public']['Tables']['jobs']['Row'];

export interface ClaimJobOptions {
  jobType?: string;
  projectId?: string;
}

/**
 * Atomically claims the next queued job using the PostgreSQL claim_next_job RPC function (with optimistic locking fallback).
 * Uses FOR UPDATE SKIP LOCKED via RPC to prevent double execution.
 */
export async function claimNextJob(
  supabase: SupabaseClient<Database>,
  options?: ClaimJobOptions
): Promise<JobRow | null> {
  const pJobType = options?.jobType ?? null;
  const pProjectId = options?.projectId ?? null;

  // 1. Try PostgreSQL RPC function claim_next_job (FOR UPDATE SKIP LOCKED)
  try {
    type RpcFn = 'claim_next_job';
    const { data, error } = await supabase.rpc(
      'claim_next_job' as unknown as RpcFn,
      {
        p_job_type: pJobType,
        p_project_id: pProjectId,
      } as unknown as Record<string, unknown>
    );

    if (!error && data && Array.isArray(data) && data.length > 0) {
      return data[0] as unknown as JobRow;
    }
  } catch (rpcErr) {
    console.warn('claim_next_job RPC warning:', rpcErr);
  }

  // 2. Optimistic locking fallback for database concurrency control
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);

  if (pJobType) query = query.eq('job_type', pJobType);
  if (pProjectId) query = query.eq('project_id', pProjectId);

  const { data: queuedJobs, error: selectErr } = await query;
  if (selectErr || !queuedJobs || queuedJobs.length === 0) {
    return null;
  }

  const candidateJob = queuedJobs[0];
  if (!candidateJob) {
    return null;
  }
  const now = new Date().toISOString();

  // Atomic state transition (queued -> running) with status guard
  const { data: claimedJob } = await supabase
    .from('jobs')
    .update({
      status: 'running',
      started_at: now,
      updated_at: now,
    })
    .eq('id', candidateJob.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();

  return claimedJob || null;
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
      ...(progress ? { progress: progress as unknown as Database['public']['Tables']['jobs']['Update']['progress'] } : {}),
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
