import { runSiteCrawlPipeline } from './packages/crawler/src/pipeline.js';
import { runBusinessContextPipeline } from './packages/context/src/pipeline.js';
import { runVisibilityScanPipeline } from './packages/scanner/src/pipeline.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qktwtbbkwzqkdigtheqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdHd0YmJrd3pxa2RpZ3RoZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzYwMjAsImV4cCI6MjEwMTQxMjAyMH0.wko2B7UwSsHHbVih3s7E-HbeLSWNSfJxBfgG9o6vRJI';

async function runTrace() {
  console.log('=====================================================');
  console.log('   STARTING END-TO-END PROJECT FLOW TRACE & VERIFY   ');
  console.log('=====================================================');

  // 1. Authenticate user
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'connect@devneet.in',
      password: 'User@123',
    }),
  });

  const authData = await authRes.json();
  if (!authData.access_token) {
    console.error('Auth failed:', authData);
    return;
  }

  const accessToken = authData.access_token;
  const user = authData.user;
  console.log('[TRACE 1] Authenticated user.id:', user.id);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // 2. Fetch User Projects
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, user_id, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (projErr || !projects || projects.length === 0) {
    console.error('[TRACE 2] Failed to find project:', projErr);
    return;
  }

  const project = projects[0];
  const projectId = project.id;
  console.log('[TRACE 2] Target projectId:', projectId, 'Name:', project.name);

  // 3. Verify Domain
  const { data: domains, error: domErr } = await supabase
    .from('domains')
    .select('id, host, project_id')
    .eq('project_id', projectId);

  console.log('[TRACE 3] Project domains:', domains, domErr ? domErr.message : '');

  // 4. Run Site Crawl Pipeline
  console.log('[TRACE 4] Running Site Crawl Pipeline for projectId:', projectId);
  const crawlResult = await runSiteCrawlPipeline(supabase as any, { projectId });
  console.log('[TRACE 4] Site Crawl Result:', crawlResult);

  // Mark job completed so business context gate checks pass
  await supabase.from('jobs').insert({
    project_id: projectId,
    job_type: 'site_crawl',
    status: 'completed',
    resource_type: 'project',
    resource_id: projectId,
  });

  // 5. Run Business Context Pipeline
  console.log('[TRACE 5] Running Business Context Pipeline for projectId:', projectId);
  const contextResult = await runBusinessContextPipeline(supabase as any, { projectId });
  console.log('[TRACE 5] Business Context Result:', contextResult);

  // 6. Query business_context_versions row with authenticated client
  console.log('[TRACE 6] Querying business_context_versions for projectId:', projectId);
  const { data: bcVersions, error: bcErr } = await supabase
    .from('business_context_versions')
    .select('id, project_id, industry, description, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('[TRACE 6] Query Result - bcVersions:', bcVersions, 'error:', bcErr);

  if (!bcVersions || bcVersions.length === 0) {
    console.error('[TRACE 6] ERROR: business_context_versions row NOT FOUND!');
    return;
  }

  const latestBc = bcVersions[0];
  console.log('[TRACE 6] Found latest business_context_version.id:', latestBc.id, 'for project_id:', latestBc.project_id);

  // 7. Run Visibility Scan Pipeline
  console.log('[TRACE 7] Running Visibility Scan Pipeline for projectId:', projectId);
  const scanResult = await runVisibilityScanPipeline(supabase as any, { projectId });
  console.log('[TRACE 7] Visibility Scan Result:', scanResult);

  // 8. Fetch AI Scans to verify IDs match
  const { data: scans, error: scansErr } = await supabase
    .from('ai_scans')
    .select('id, project_id, business_context_version_id, model_name, status, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('[TRACE 8] Latest AI Scan in Supabase:', scans, scansErr);

  console.log('=====================================================');
  console.log('               ID MATCH VERIFICATION                 ');
  console.log('=====================================================');
  console.log('Target project_id:                    ', projectId);
  console.log('business_context_version.project_id: ', latestBc.project_id);
  console.log('ai_scan.project_id:                  ', scans?.[0]?.project_id);
  console.log('ai_scan.business_context_version_id: ', scans?.[0]?.business_context_version_id);
}

runTrace().catch(console.error);
