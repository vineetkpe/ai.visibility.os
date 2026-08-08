'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import { runs } from '@ai-visibility-os/jobs';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardOverviewData {
  project: {
    id: string;
    name: string;
    createdAt: string;
    primaryDomain: string | null;
  };
  latestScan: {
    id: string;
    status: string;
    aiModel: string;
    queryPrompt: string;
    visibilityScore: number | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
  visibility: {
    currentScore: number | null;
    mentionHistory: Array<{
      date: string;
      score: number;
      prompt: string;
    }>;
    platformBreakdown: Array<{
      provider: string;
      displayName: string;
      isAvailable: boolean;
      score: number | null;
      scansCount: number;
    }>;
  };
  competitors: {
    topCompetitors: Array<{
      id: string;
      name: string;
      domainName: string;
      latestVisibilityScore: number | null;
      tier2Crawled: boolean;
    }>;
    visibilityComparison: Array<{
      name: string;
      score: number;
      isOwnDomain: boolean;
    }>;
    citationComparison: Array<{
      name: string;
      citationCount: number;
      isOwnDomain: boolean;
    }>;
  };
  recommendations: {
    criticalList: Array<{ id: string; title: string; summary: string; category: string }>;
    highPriorityList: Array<{ id: string; title: string; summary: string; category: string }>;
    recentlyResolvedList: Array<{ id: string; title: string; resolvedAt: string; reason: string }>;
    openCriticalCount: number;
    openHighCount: number;
    totalResolvedCount: number;
  };
  websiteHealth: {
    totalPages: number;
    schemaCoveragePct: number;
    metadataCoveragePct: number;
  };
  recentActivity: {
    recentJobs: Array<{
      id: string;
      jobType: string;
      status: string;
      createdAt: string;
      errorMessage: string | null;
      triggerRunId: string | null;
      progress: { completed: number; total: number } | null;
    }>;
    recentChanges: Array<{
      id: string;
      recommendationTitle: string;
      previousStatus: string | null;
      newStatus: string;
      reason: string;
      evaluatedAt: string;
    }>;
  };
}

async function verifyUserProject(supabase: SupabaseClient<Database>, projectId?: string) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Authentication required.');
  }

  let query = supabase
    .from('projects')
    .select('id, name, created_at, domains(id, host, is_primary)')
    .eq('user_id', user.id);

  if (projectId) {
    query = query.eq('id', projectId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data: projects, error } = await query;
  if (error || !projects || projects.length === 0) {
    return { user, project: null };
  }

  return { user, project: projects[0] };
}

/**
 * Server action to fetch comprehensive real database metrics for the main Dashboard view.
 */
export async function getDashboardOverviewData(
  projectId?: string
): Promise<ActionResult<DashboardOverviewData>> {
  try {
    const supabase = await createClient();
    const { project } = await verifyUserProject(supabase, projectId);

    if (!project) {
      return { success: true, data: undefined };
    }

    const currentProjectId = project.id;
    const primaryDomainObj = project.domains?.find((d) => d.is_primary) || project.domains?.[0];
    const primaryDomainName = primaryDomainObj?.host || null;

    // 1. Fetch Latest Scan
    const { data: latestScanRow } = await supabase
      .from('ai_scans')
      .select('id, status, model_name, prompt_text, is_mentioned, created_at, completed_at')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestScan = latestScanRow
      ? {
          id: latestScanRow.id,
          status: latestScanRow.status,
          aiModel: latestScanRow.model_name || 'Gemini',
          queryPrompt: latestScanRow.prompt_text,
          visibilityScore: latestScanRow.is_mentioned ? 100 : 0,
          createdAt: latestScanRow.created_at,
          completedAt: latestScanRow.completed_at,
        }
      : null;

    // 2. Fetch Completed Scans for Mention History Trend
    const { data: completedScans } = await supabase
      .from('ai_scans')
      .select('id, is_mentioned, completed_at, prompt_text, model_name')
      .eq('project_id', currentProjectId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(30);

    const mentionHistory = (completedScans || [])
      .filter((s) => s.completed_at)
      .map((s) => ({
        date: new Date(s.completed_at!).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        score: s.is_mentioned ? 100 : 0,
        prompt: s.prompt_text,
      }));

    // AI Platform Breakdown - Gemini has real data; others flagged as unavailable
    const geminiScans = (completedScans || []).filter(
      (s) =>
        (s.model_name && (s.model_name === 'google-gemini' || s.model_name.includes('gemini'))) ||
        true
    );
    const geminiAvg =
      geminiScans.length > 0
        ? Math.round((geminiScans.filter((s) => s.is_mentioned).length / geminiScans.length) * 100)
        : null;

    const platformBreakdown = [
      {
        provider: 'google-gemini',
        displayName: 'Google Gemini',
        isAvailable: true,
        score: geminiAvg,
        scansCount: geminiScans.length,
      },
      {
        provider: 'openai-chatgpt',
        displayName: 'ChatGPT (OpenAI)',
        isAvailable: false,
        score: null,
        scansCount: 0,
      },
      {
        provider: 'anthropic-claude',
        displayName: 'Claude (Anthropic)',
        isAvailable: false,
        score: null,
        scansCount: 0,
      },
      {
        provider: 'perplexity-ai',
        displayName: 'Perplexity AI',
        isAvailable: false,
        score: null,
        scansCount: 0,
      },
    ];

    // 3. Fetch Competitors & Competitor Scans
    const { data: competitorsList } = await supabase
      .from('competitors')
      .select('id, name, domain_name, created_at')
      .eq('project_id', currentProjectId);

    const competitorIds = (competitorsList || []).map((c) => c.id);

    // Latest competitor scans
    const { data: compScans } =
      competitorIds.length > 0
        ? await supabase
            .from('competitor_scans')
            .select('id, competitor_id, visibility_score, created_at')
            .in('competitor_id', competitorIds)
            .order('created_at', { ascending: false })
        : { data: [] };

    const compScanMap = new Map<string, number | null>();
    (compScans || []).forEach((cs) => {
      if (!compScanMap.has(cs.competitor_id)) {
        compScanMap.set(cs.competitor_id, cs.visibility_score);
      }
    });

    // Tier 2 Crawl status check from competitor domains
    const { data: compDomains } =
      competitorIds.length > 0
        ? await supabase
            .from('domains')
            .select('id, host')
            .eq('project_id', currentProjectId)
            .eq('is_primary', false)
        : { data: [] };

    const crawledCompDomainSet = new Set(
      (compDomains || []).map((d) => (d.host || '').toLowerCase())
    );

    const topCompetitors = (competitorsList || []).map((c) => ({
      id: c.id,
      name: c.name,
      domainName: c.domain_name,
      latestVisibilityScore: compScanMap.get(c.id) ?? null,
      tier2Crawled: crawledCompDomainSet.has(c.domain_name.toLowerCase()),
    }));

    // Own latest score for comparison chart
    const latestOwnScore = latestScan?.visibilityScore ?? 0;
    const visibilityComparison = [
      {
        name: primaryDomainName || 'Own Domain',
        score: latestOwnScore,
        isOwnDomain: true,
      },
      ...topCompetitors.map((c) => ({
        name: c.name,
        score: c.latestVisibilityScore ?? 0,
        isOwnDomain: false,
      })),
    ];

    // Citations grouping (own vs competitor)
    const { data: citationsData } = await supabase
      .from('citations')
      .select('id, is_own_domain, competitor_id, source_domain')
      .in(
        'scan_id',
        (completedScans || []).map((s) => s.id)
      );

    const ownCitationsCount = (citationsData || []).filter((c) => c.is_own_domain).length;
    const citationComparison = [
      {
        name: primaryDomainName || 'Own Domain',
        citationCount: ownCitationsCount,
        isOwnDomain: true,
      },
      ...topCompetitors.map((comp) => {
        const count = (citationsData || []).filter((c) => c.competitor_id === comp.id).length;
        return {
          name: comp.name,
          citationCount: count,
          isOwnDomain: false,
        };
      }),
    ];

    // 4. Fetch Recommendations Overview
    const { data: recs } = await supabase
      .from('recommendations')
      .select('id, title, description, category, priority, status, created_at')
      .eq('project_id', currentProjectId);

    const openRecs = (recs || []).filter((r) => r.status === 'open');
    const criticalList = openRecs
      .filter((r) => r.priority === 'critical')
      .slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, summary: r.description, category: r.category }));

    const highPriorityList = openRecs
      .filter((r) => r.priority === 'high')
      .slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, summary: r.description, category: r.category }));

    const { data: resolvedHistory } = await supabase
      .from('recommendation_history')
      .select('id, recommendation_id, reason, evaluated_at, recommendations(title)')
      .eq('new_status', 'completed')
      .order('evaluated_at', { ascending: false })
      .limit(5);

    const recentlyResolvedList = (resolvedHistory || []).map((h) => ({
      id: h.id,
      title:
        (h.recommendations as unknown as { title: string } | null)?.title || 'Optimization Task',
      resolvedAt: h.evaluated_at,
      reason: h.reason,
    }));

    // 5. Website Health Metrics
    const domainIds = (project.domains || []).map((d) => d.id);
    const { data: pages } =
      domainIds.length > 0
        ? await supabase
            .from('pages')
            .select('id, title, meta_description, schema_org_types')
            .in('domain_id', domainIds)
        : { data: [] };

    const totalPages = (pages || []).length;
    let schemaCount = 0;
    let metadataCount = 0;

    (pages || []).forEach((p) => {
      const types = p.schema_org_types as string[] | null;
      if (Array.isArray(types) && types.length > 0) {
        schemaCount++;
      }
      if (
        p.title &&
        p.title.trim().length > 0 &&
        p.meta_description &&
        p.meta_description.trim().length > 0
      ) {
        metadataCount++;
      }
    });

    const schemaCoveragePct = totalPages > 0 ? Math.round((schemaCount / totalPages) * 100) : 0;
    const metadataCoveragePct = totalPages > 0 ? Math.round((metadataCount / totalPages) * 100) : 0;

    // 6. Recent Jobs & Activity
    const { data: jobsList } = await supabase
      .from('jobs')
      .select('id, job_type, status, error_message, trigger_run_id, progress, created_at')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentJobs = (jobsList || []).map((j) => ({
      id: j.id,
      jobType: j.job_type,
      status: j.status,
      createdAt: j.created_at,
      errorMessage: j.error_message,
      triggerRunId: j.trigger_run_id,
      progress: (j.progress as unknown as { completed: number; total: number } | null) || null,
    }));

    const { data: recentHistory } = await supabase
      .from('recommendation_history')
      .select('id, previous_status, new_status, reason, evaluated_at, recommendations(title)')
      .order('evaluated_at', { ascending: false })
      .limit(5);

    const recentChanges = (recentHistory || []).map((h) => ({
      id: h.id,
      recommendationTitle:
        (h.recommendations as unknown as { title: string } | null)?.title ||
        'Recommendation Status',
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      reason: h.reason,
      evaluatedAt: h.evaluated_at,
    }));

    return {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          createdAt: project.created_at,
          primaryDomain: primaryDomainName,
        },
        latestScan,
        visibility: {
          currentScore: latestScan?.visibilityScore ?? null,
          mentionHistory,
          platformBreakdown,
        },
        competitors: {
          topCompetitors,
          visibilityComparison,
          citationComparison,
        },
        recommendations: {
          criticalList,
          highPriorityList,
          recentlyResolvedList,
          openCriticalCount: openRecs.filter((r) => r.priority === 'critical').length,
          openHighCount: openRecs.filter((r) => r.priority === 'high').length,
          totalResolvedCount: (recs || []).filter((r) => r.status === 'completed').length,
        },
        websiteHealth: {
          totalPages,
          schemaCoveragePct,
          metadataCoveragePct,
        },
        recentActivity: {
          recentJobs,
          recentChanges,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data.';
    return { success: false, error: message };
  }
}

export interface ScanHistoryItem {
  id: string;
  queryPrompt: string;
  aiModel: string;
  status: string;
  visibilityScore: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Server Action for `/dashboard/scans` route listing all scans for the project.
 */
export async function getScanHistoryData(
  projectId?: string
): Promise<ActionResult<{ projectId: string; scans: ScanHistoryItem[] }>> {
  try {
    const supabase = await createClient();
    const { project } = await verifyUserProject(supabase, projectId);

    if (!project) {
      return { success: false, error: 'Project not found.' };
    }

    const { data: scans, error } = await supabase
      .from('ai_scans')
      .select(
        'id, prompt_text, model_name, status, is_mentioned, error_message, created_at, completed_at'
      )
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const items: ScanHistoryItem[] = (scans || []).map((s) => ({
      id: s.id,
      queryPrompt: s.prompt_text,
      aiModel: s.model_name || 'Gemini',
      status: s.status,
      visibilityScore: s.is_mentioned ? 100 : 0,
      errorMessage: s.error_message,
      createdAt: s.created_at,
      completedAt: s.completed_at,
    }));

    return {
      success: true,
      data: {
        projectId: project.id,
        scans: items,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch scan history.';
    return { success: false, error: message };
  }
}

/**
 * Server action to cancel a pending or running background job.
 * Verification requirement: Scoped via auth.uid() project ownership.
 * Uses @trigger.dev/sdk/v3 runs.cancel(runId) API.
 */
export async function cancelJobAction(
  jobId: string
): Promise<ActionResult<{ jobId: string; alreadyFinished?: boolean }>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    // 2. Fetch Job & verify project ownership via RLS/query
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, project_id, status, trigger_run_id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return { success: false, error: 'Job record not found.' };
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', job.project_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!project) {
      return { success: false, error: 'Project access denied.' };
    }

    // Handle already completed/failed jobs gracefully
    if (job.status === 'completed' || job.status === 'failed') {
      return { success: true, data: { jobId, alreadyFinished: true } };
    }

    // 3. Invoke Trigger.dev runs.cancel API if run ID exists
    if (job.trigger_run_id) {
      try {
        await runs.cancel(job.trigger_run_id);
      } catch (triggerCancelErr) {
        // Fail gracefully if run is already finished or not found on Trigger.dev
        console.warn(
          `Trigger.dev runs.cancel warning for run ${job.trigger_run_id}:`,
          triggerCancelErr
        );
      }
    }

    // 4. Update jobs row status to 'failed' with clear error_message
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelled by user',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateErr) {
      return {
        success: false,
        error: updateErr.message || 'Failed to update job cancellation status.',
      };
    }

    return { success: true, data: { jobId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel background job.';
    return { success: false, error: message };
  }
}
