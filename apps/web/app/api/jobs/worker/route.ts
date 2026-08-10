import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServerClient, createTokenClient } from '@ai-visibility-os/database';
import {
  claimNextJob,
  completeJob,
  retryJob,
  runRecommendationsJob,
  runBusinessContextJob,
  runCompetitorJob,
  runScannerJob,
  runCrawlerJob,
} from '@ai-visibility-os/jobs';

export const maxDuration = 300; // Vercel maximum execution limit (5 minutes)

// Rate Limiter Storage (Per-instance sliding window + DB query)
const unauthRateMap = new Map<string, number[]>();
const authRateMap = new Map<string, number[]>();

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extracts client IP address from standard serverless request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Worker Authorization Helper
 * Validates request against JOB_WORKER_SECRET using timing-safe comparison.
 * Fails closed immediately if JOB_WORKER_SECRET is missing or empty.
 */
function checkWorkerAuth(request: NextRequest): { authorized: boolean; error?: string; token?: string } {
  const secret = process.env.JOB_WORKER_SECRET;
  if (!secret || !secret.trim()) {
    console.error('[SECURITY ERROR] JOB_WORKER_SECRET environment variable is not configured on server.');
    return {
      authorized: false,
      error: 'Server configuration error: Worker authorization secret is not configured.',
    };
  }

  const trimmedSecret = secret.trim();

  // 1. Check Bearer Authorization header
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (safeCompare(token, trimmedSecret)) {
      return { authorized: true, token };
    }
  }

  // 2. Check x-job-worker-secret header
  const customHeader = request.headers.get('x-job-worker-secret') || '';
  if (customHeader && safeCompare(customHeader.trim(), trimmedSecret)) {
    return { authorized: true, token: customHeader.trim() };
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
 * Serverless Rate Limiter Helper
 * Evaluates request window frequency per IP to prevent endpoint abuse.
 */
function checkRateLimit(ip: string, authorized: boolean): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = authorized ? 60 : 10;

  const map = authorized ? authRateMap : unauthRateMap;
  const timestamps = (map.get(ip) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return false;
  }

  timestamps.push(now);
  map.set(ip, timestamps);
  return true;
}

/**
 * Internal Worker API Handler (POST Only)
 * Claims and executes queued jobs atomically using FOR UPDATE SKIP LOCKED via RPC.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);

  // 1. Enforce Authentication Security
  const authCheck = checkWorkerAuth(request);

  // 2. Rate Limit Enforcement
  const isAllowed = checkRateLimit(clientIp, authCheck.authorized);
  if (!isAllowed) {
    return NextResponse.json(
      {
        success: false,
        error: authCheck.authorized
          ? 'Worker endpoint rate limit exceeded (60 requests/min). Please slow down.'
          : 'Too many unauthorized worker requests. Rate limit exceeded.',
      },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

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
      if (typeof body.jobType === 'string' && body.jobType.trim()) {
        const allowedJobTypes = ['site_crawl', 'competitor_sync', 'business_context', 'visibility_scan', 'recommendations'];
        if (allowedJobTypes.includes(body.jobType.trim())) {
          options.jobType = body.jobType.trim();
        }
      }
      if (typeof body.projectId === 'string' && body.projectId.trim()) {
        options.projectId = body.projectId.trim();
      }
    }
  } catch {
    // Body parsing optional
  }

  // 3. Initialize Supabase client
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  // Select appropriate auth context: service role, valid 3-part JWT user token, or standard server client
  let supabase;
  if (serviceRoleKey && serviceRoleKey.trim()) {
    supabase = createTokenClient(serviceRoleKey.trim());
  } else if (bearerToken && bearerToken.split('.').length === 3) {
    supabase = createTokenClient(bearerToken);
  } else {
    supabase = createServerClient({ getAll: () => [] });
  }

  // 4. Atomically claim next job
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

  // 5. Dispatch job execution by job_type
  try {
    switch (job.job_type) {
      case 'site_crawl': {
        if (job.resource_type === 'competitor') {
          await runCompetitorJob(supabase, job);
          break;
        }

        await runCrawlerJob(supabase, job);
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
        await runScannerJob(supabase, job);
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

    // 6. Complete Job upon clean execution
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

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Worker endpoint accepts POST only.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function GET(): Promise<NextResponse> { return methodNotAllowed(); }
export async function PUT(): Promise<NextResponse> { return methodNotAllowed(); }
export async function DELETE(): Promise<NextResponse> { return methodNotAllowed(); }
export async function PATCH(): Promise<NextResponse> { return methodNotAllowed(); }
