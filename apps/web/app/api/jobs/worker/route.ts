import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@ai-visibility-os/database';
import { claimNextJob, completeJob, retryJob, runRecommendationsJob, runBusinessContextJob, runCompetitorJob } from '@ai-visibility-os/jobs';
import { runDiscoveryPipeline } from '@ai-visibility-os/crawler';
import { runVisibilityScanPipeline } from '@ai-visibility-os/scanner';

export const maxDuration = 300; // Vercel maximum execution limit (5 minutes)

/**
 * Worker Authorization Helper
 * Validates request against JOB_WORKER_SECRET without exposing credentials.
 * Fails closed immediately if JOB_WORKER_SECRET is missing or empty.
 */
function checkWorkerAuth(request: NextRequest): { authorized: boolean; error?: string } {
  const secret = process.env.JOB_WORKER_SECRET;
  if (!secret || !secret.trim()) {
    console.error('[SECURITY ERROR] JOB_WORKER_SECRET environment variable is not configured on server.');
    return {
      authorized: false,
      error: 'Server configuration error: Worker authorization secret is not configured.',
    };
  }

  const trimmedSecret = secret.trim();
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ') && authHeader.substring(7) === trimmedSecret) {
    return { authorized: true };
  }

  const customHeader = request.headers.get('x-job-worker-secret') || '';
  if (customHeader === trimmedSecret) {
    return { authorized: true };
  }

  return { authorized: false, error: 'Unauthorized worker request.' };
}

/**
 * Clean Error Formatting Helper
 * Guarantees a non-empty human-readable error message without raw JSON artifacts.
 */
function cleanErrorMessage(err: unknown): string {
  if (!err) return 'Job execution failed with an unknown error.';
  let msg = err instanceof Error ? err.message : String(err);
  if (!msg || !msg.trim()) return 'Job execution failed with an unknown error.';

  msg = msg.trim();
  if (msg.startsWith('{') && msg.includes('"message"')) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message && typeof parsed.error.message === 'string') {
        msg = parsed.error.message;
      }
    } catch {
      // Keep original string if JSON parsing fails
    }
  }

  return msg || 'Job execution failed with an unknown error.';
}

/**
 * Internal Worker API Handler (POST Only)
 * Claims and executes queued jobs atomically using FOR UPDATE SKIP LOCKED via RPC.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Enforce Authentication Security (Fail Closed if secret unconfigured)
  const authCheck = checkWorkerAuth(request);
  if (!authCheck.authorized) {
    const status = authCheck.error?.startsWith('Server configuration error') ? 500 : 401;
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status }
    );
  }

  // Parse optional jobType or projectId filter from request body
  const options: { jobType?: string; projectId?: string } = {};
  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      if (typeof body.jobType === 'string') options.jobType = body.jobType;
      if (typeof body.projectId === 'string') options.projectId = body.projectId;
    }
  } catch {
    // Body parsing optional
  }

  // 2. Initialize Supabase client
  const supabase = createServerClient({ getAll: () => [] });

  // 3. Atomically claim next job
  let job;
  try {
    job = await claimNextJob(supabase, options);
  } catch (claimErr: unknown) {
    const errMessage = cleanErrorMessage(claimErr);
    return NextResponse.json(
      { success: false, error: `Failed to claim job: ${errMessage}` },
      { status: 500 }
    );
  }

  if (!job) {
    return NextResponse.json(
      { success: true, claimed: false, message: 'No queued job available.' },
      { status: 200 }
    );
  }

  console.log(`[WORKER] Claimed job ${job.id} (type: ${job.job_type}, project: ${job.project_id})`);

  // 4. Dispatch job execution by job_type
  try {
    switch (job.job_type) {
      case 'site_crawl': {
        if (job.resource_type === 'competitor') {
          await runCompetitorJob(supabase, job);
          break;
        }

        const progressObj = (job.progress as Record<string, unknown>) || {};
        const domainId =
          (typeof progressObj.domain_id === 'string' ? progressObj.domain_id : undefined) || job.resource_id;

        if (!domainId) {
          throw new Error('site_crawl job requires resource_id (domainId).');
        }

        // Fetch domain host
        const { data: domain } = await supabase
          .from('domains')
          .select('host')
          .eq('id', domainId)
          .single();

        const domainName = domain?.host || 'example.com';
        await runDiscoveryPipeline(supabase, {
          domainId,
          domainName,
          jobId: job.id,
        });
        break;
      }

      case 'competitor_sync': {
        await runCompetitorJob(supabase, job);
        break;
      }

      case 'business_context': {
        await runBusinessContextJob(supabase, job);
        break;
      }

      case 'visibility_scan': {
        await runVisibilityScanPipeline(supabase, {
          projectId: job.project_id,
          jobId: job.id,
        });
        break;
      }

      case 'recommendations': {
        await runRecommendationsJob(supabase, job);
        break;
      }

      default: {
        throw new Error(`Unsupported job_type: '${job.job_type}'.`);
      }
    }

    // 5. Complete Job upon clean execution
    const completedJob = await completeJob(supabase, job.id);
    return NextResponse.json(
      {
        success: true,
        claimed: true,
        jobId: completedJob.id,
        jobType: completedJob.job_type,
        status: completedJob.status,
      },
      { status: 200 }
    );
  } catch (execErr: unknown) {
    const errorMessage = cleanErrorMessage(execErr);
    console.error(`[WORKER] Job ${job.id} execution failed:`, errorMessage);

    // Retry or fail job
    const updatedJob = await retryJob(supabase, job.id, errorMessage);
    return NextResponse.json(
      {
        success: false,
        claimed: true,
        jobId: updatedJob.id,
        jobType: updatedJob.job_type,
        status: updatedJob.status,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle non-POST methods with 405 Method Not Allowed
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Worker endpoint accepts POST only.' },
    { status: 405 }
  );
}
