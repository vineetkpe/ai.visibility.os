'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, Database } from '@ai-visibility-os/database';

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
    .eq('user_id', user.id)
    .is('deleted_at', null);

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
 * Server action to fetch real database metrics for the main Dashboard view using CURRENT schema.
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
          visibilityScore: latestScanRow.status === 'completed' ? (latestScanRow.is_mentioned ? 100 : 0) : null,
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

    const completedList = completedScans || [];

    const mentionHistory = completedList
      .filter((s): s is typeof s & { completed_at: string } => Boolean(s.completed_at))
      .map((s) => ({
        date: new Date(s.completed_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        score: s.is_mentioned ? 100 : 0,
        prompt: s.prompt_text,
      }));

    // AI Platform Breakdown
    const geminiScans = completedList;
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

    // 3. Fetch ONLY CONFIRMED Competitors for Project
    const { data: confirmedCompetitors } = await supabase
      .from('competitors')
      .select('id, name, created_at, domain_id, domains!inner(host)')
      .eq('project_id', currentProjectId)
      .eq('status', 'confirmed');

    const confirmedList = confirmedCompetitors || [];

    // Fetch Citations across completed scans
    const scanIds = completedList.map((s) => s.id);
    const { data: citationsData } =
      scanIds.length > 0
        ? await supabase
            .from('citations')
            .select('id, ai_scan_id, url, position, is_own_domain, competitor_id')
            .in('ai_scan_id', scanIds)
        : { data: [] };

    const citationList = citationsData || [];

    // Calculate competitor visibility scores & citation counts
    const totalScansCount = completedList.length;

    const topCompetitors = confirmedList.map((c) => {
      const host = c.domains?.host || '';
      const compCitations = citationList.filter((cit) => cit.competitor_id === c.id);
      const citedScansCount = new Set(compCitations.map((cit) => cit.ai_scan_id)).size;
      const visibilityScore =
        totalScansCount > 0 ? Math.round((citedScansCount / totalScansCount) * 100) : null;

      return {
        id: c.id,
        name: c.name,
        domainName: host,
        latestVisibilityScore: visibilityScore,
        tier2Crawled: false,
      };
    });

    const ownVisibilityScore = latestScan?.visibilityScore ?? (geminiAvg ?? 0);
    const visibilityComparison = [
      {
        name: primaryDomainName || 'Own Domain',
        score: ownVisibilityScore,
        isOwnDomain: true,
      },
      ...topCompetitors.map((c) => ({
        name: c.name,
        score: c.latestVisibilityScore ?? 0,
        isOwnDomain: false,
      })),
    ];

    const ownCitationsCount = citationList.filter((c) => c.is_own_domain).length;
    const citationComparison = [
      {
        name: primaryDomainName || 'Own Domain',
        citationCount: ownCitationsCount,
        isOwnDomain: true,
      },
      ...topCompetitors.map((comp) => {
        const count = citationList.filter((c) => c.competitor_id === comp.id).length;
        return {
          name: comp.name,
          citationCount: count,
          isOwnDomain: false,
        };
      }),
    ];

    // 4. Fetch Recommendations from CURRENT recommendations table
    const { data: recs } = await supabase
      .from('recommendations')
      .select('id, title, description, category, priority, status, created_at, resolved_at')
      .eq('project_id', currentProjectId)
      .is('superseded_by', null);

    const allRecs = recs || [];
    const openRecs = allRecs.filter((r) => r.status === 'open' || r.status === 'in_progress');

    const criticalList = openRecs
      .filter((r) => r.priority === 'critical')
      .slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, summary: r.description || '', category: r.category }));

    const highPriorityList = openRecs
      .filter((r) => r.priority === 'high')
      .slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, summary: r.description || '', category: r.category }));

    const resolvedRecs = allRecs
      .filter((r) => r.status === 'resolved')
      .sort((a, b) => new Date(b.resolved_at || b.created_at).getTime() - new Date(a.resolved_at || a.created_at).getTime())
      .slice(0, 5);

    const recentlyResolvedList = resolvedRecs.map((r) => ({
      id: r.id,
      title: r.title,
      resolvedAt: r.resolved_at || r.created_at,
      reason: 'Issue resolved',
    }));

    // 5. Website Health Metrics (pages joined with page_metadata)
    const domainIds = (project.domains || []).map((d) => d.id);
    const { data: pages } =
      domainIds.length > 0
        ? await supabase
            .from('pages')
            .select('id, status_code, page_metadata(title, meta_description, schema_json)')
            .in('domain_id', domainIds)
        : { data: [] };

    const pageList = pages || [];
    const totalPages = pageList.length;
    let schemaCount = 0;
    let metadataCount = 0;

    pageList.forEach((p) => {
      const meta = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata;
      if (meta) {
        if (meta.schema_json) {
          schemaCount++;
        }
        if (meta.title && meta.title.trim().length > 0 && meta.meta_description && meta.meta_description.trim().length > 0) {
          metadataCount++;
        }
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

    const recentJobs = (jobsList || []).map((j) => {
      const rawProg = j.progress as { completed?: number; total?: number } | null;
      const progress =
        rawProg && typeof rawProg.completed === 'number' && typeof rawProg.total === 'number'
          ? { completed: rawProg.completed, total: rawProg.total }
          : null;

      return {
        id: j.id,
        jobType: j.job_type,
        status: j.status,
        createdAt: j.created_at,
        errorMessage: j.error_message,
        triggerRunId: j.trigger_run_id,
        progress,
      };
    });

    const recentChanges = resolvedRecs.map((r) => ({
      id: r.id,
      recommendationTitle: r.title,
      previousStatus: 'open',
      newStatus: 'resolved',
      reason: 'Issue resolved',
      evaluatedAt: r.resolved_at || r.created_at,
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
          totalResolvedCount: allRecs.filter((r) => r.status === 'resolved').length,
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
      visibilityScore: s.status === 'completed' ? (s.is_mentioned ? 100 : 0) : null,
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
 */
export async function cancelJobAction(
  jobId: string
): Promise<ActionResult<{ jobId: string; alreadyFinished?: boolean }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, project_id, status, trigger_run_id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return { success: false, error: 'Job record not found.' };
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', job.project_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!project) {
      return { success: false, error: 'Project access denied.' };
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return { success: true, data: { jobId, alreadyFinished: true } };
    }

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
