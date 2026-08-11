import { NextResponse } from 'next/server';

export const maxDuration = 300;

/**
 * Vercel Cron entrypoint for the durable job worker.
 * Vercel authenticates cron requests with CRON_SECRET; this route then
 * invokes the existing worker endpoint using the dedicated worker secret.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get('authorization') || '';

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const workerSecret = process.env.JOB_WORKER_SECRET?.trim();
  if (!workerSecret) {
    console.error('[CRON WORKER] JOB_WORKER_SECRET is not configured.');
    return NextResponse.json(
      { success: false, error: 'Worker authorization secret is not configured.' },
      { status: 500 }
    );
  }

  const workerUrl = new URL('/api/jobs/worker', request.url);

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${workerSecret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({
      success: false,
      error: `Worker returned HTTP ${response.status}.`,
    }));

    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[CRON WORKER] Failed to invoke worker:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
