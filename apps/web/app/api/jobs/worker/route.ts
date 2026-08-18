import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServerClient, createServiceClient, type SupabaseClient, type Database } from '@ai-visibility-os/database';
import { claimNextJob, completeJob, retryJob, runRecommendationsJob, runBusinessContextJob, runCompetitorJob, runScannerJob, runCrawlerJob } from '@ai-visibility-os/jobs';

export const maxDuration = 300;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8'); const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) { const firstIp = forwarded.split(',')[0]?.trim(); if (firstIp) return firstIp; }
  const realIp = request.headers.get('x-real-ip'); if (realIp?.trim()) return realIp.trim();
  return '127.0.0.1';
}
function checkWorkerAuth(request: NextRequest): { authorized: boolean; error?: string; token?: string } {
  const workerSecret = process.env.JOB_WORKER_SECRET?.trim(); const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization') || ''; const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const customHeader = request.headers.get('x-job-worker-secret')?.trim() || '';
  if (workerSecret && token && safeCompare(token, workerSecret)) return { authorized: true, token };
  if (workerSecret && customHeader && safeCompare(customHeader, workerSecret)) return { authorized: true, token: customHeader };
  if (cronSecret && token && safeCompare(token, cronSecret)) return { authorized: true, token };
  if (!workerSecret && !cronSecret) return { authorized: false, error: 'Server configuration error: Worker authorization secret is not configured.' };
  return { authorized: false, error: 'Unauthorized worker request.' };
}
function cleanErrorMessage(err: unknown): string {
  if (!err) return 'Job execution failed with an unknown error.'; let msg = err instanceof Error ? err.message : String(err); if (!msg?.trim()) return 'Job execution failed with an unknown error.';
  msg = msg.trim(); if (msg.startsWith('{') && msg.includes('"message"')) { try { const parsed = JSON.parse(msg); if (parsed.error?.message && typeof parsed.error.message === 'string') msg = parsed.error.message; } catch { /* ignore */ } }
  return msg || 'Job execution failed with an unknown error.';
}
async function checkDistributedRateLimit(supabase: SupabaseClient<Database>, ip: string, authorized: boolean, skipRateLimit = false): Promise<{ allowed: boolean; limit: number; currentCount: number }> {
  if (skipRateLimit && authorized) return { allowed: true, limit: Number.MAX_SAFE_INTEGER, currentCount: 0 };
  const maxAllowed = authorized ? 60 : 10;
  try {
    const { data, error } = await supabase.rpc('check_worker_rate_limit', { p_rate_key: `${authorized ? 'auth' : 'unauth'}:${ip}`, p_max_requests: maxAllowed, p_window_seconds: 60 });
    if (error || !data || !Array.isArray(data) || data.length === 0) { if (error) console.error('[SECURITY ERROR] Worker rate-limit RPC failed:', error.message); return { allowed: false, limit: maxAllowed, currentCount: maxAllowed + 1 }; }
    const result = data[0]; if (!result) return { allowed: false, limit: maxAllowed, currentCount: maxAllowed + 1 };
    return { allowed: result.allowed === true, limit: maxAllowed, currentCount: Number(result.current_count ?? maxAllowed + 1) };
  } catch (err) { console.error('[SECURITY ERROR] Worker rate-limit check failed:', cleanErrorMessage(err)); return { allowed: false, limit: maxAllowed, currentCount: maxAllowed + 1 }; }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request); const authCheck = checkWorkerAuth(request);
  if (!authCheck.authorized) return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.error?.startsWith('Server configuration error') ? 500 : 401 });

  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    console.error('[SECURITY ERROR] Worker service key is not configured. Refusing to run with an RLS-bound client.');
    return NextResponse.json({ success: false, error: 'Server configuration error: Worker service key is not configured.' }, { status: 500 });
  }
  const supabase = createServiceClient(serviceKey);
  const supabaseCron = request.headers.get('x-supabase-worker') === '1';

  const rateLimit = await checkDistributedRateLimit(supabase, clientIp, true, supabaseCron);
  if (!rateLimit.allowed) return NextResponse.json({ success: false, error: `Worker endpoint rate limit exceeded (${rateLimit.limit} requests/min). Please slow down.` }, { status: 429, headers: { 'Retry-After': '60' } });

  const options: { jobType?: string; projectId?: string } = {};
  try { const body = await request.json(); if (body && typeof body === 'object') { const allowed = ['site_crawl', 'competitor_sync', 'business_context', 'visibility_scan', 'recommendations']; if (typeof body.jobType === 'string' && allowed.includes(body.jobType.trim())) options.jobType = body.jobType.trim(); if (typeof body.projectId === 'string' && body.projectId.trim()) options.projectId = body.projectId.trim(); } } catch { /* ignore */ }

  let job;
  try { job = await claimNextJob(supabase, options); } catch (claimErr) { return NextResponse.json({ success: false, error: `Failed to claim job: ${cleanErrorMessage(claimErr)}` }, { status: 500 }); }
  if (!job) return NextResponse.json({ success: true, claimed: false, message: 'No queued job available.' }, { status: 200 });
  console.log(`[WORKER] Claimed job ${job.id} (type: ${job.job_type}, project: ${job.project_id})`);
  try {
    switch (job.job_type) {
      case 'site_crawl': if (job.resource_type === 'competitor') await runCompetitorJob(supabase, job); else await runCrawlerJob(supabase, job); break;
      case 'competitor_sync': await runCompetitorJob(supabase, job); break;
      case 'business_context': await runBusinessContextJob(supabase, job); break;
      case 'visibility_scan': await runScannerJob(supabase, job); break;
      case 'recommendations': await runRecommendationsJob(supabase, job); break;
      default: throw new Error(`Unsupported job type: ${job.job_type}`);
    }
    await completeJob(supabase, job.id); return NextResponse.json({ success: true, claimed: true, jobId: job.id, status: 'completed' }, { status: 200 });
  } catch (executionErr) {
    const errorMessage = cleanErrorMessage(executionErr); try { await retryJob(supabase, job.id, errorMessage); } catch (retryErr) { console.error(`[WORKER] Failed to persist retry state for job ${job.id}:`, cleanErrorMessage(retryErr)); }
    return NextResponse.json({ success: false, claimed: true, jobId: job.id, error: errorMessage }, { status: 500 });
  }
}
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
