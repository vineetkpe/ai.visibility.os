import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  Recommendation,
  RecommendationEngineRunResult,
  RecommendationStatus,
  RecommendationPriority,
  ExtractionMethod,
  EvidenceRef,
} from './types';
import { detectProjectIssues } from './rules';
import { phraseRecommendationWithGemini } from './phrasing';

/**
 * Main AI Recommendation Engine Pipeline.
 * Detects issues from real evidence, scores 1..5 impact & effort, phrases recommendations,
 * deduplicates against open issues using scope_key, and auto-resolves fixed recommendations.
 */
export async function runRecommendationEngine(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<RecommendationEngineRunResult> {
  // 1. Detect Issues from Evidence
  const detectedIssues = await detectProjectIssues(supabase, projectId);

  let createdCount = 0;
  let updatedCount = 0;
  let autoResolvedCount = 0;

  const processedScopeKeys = new Set<string>();

  // Fetch existing open / in_progress recommendations for project
  const { data: existingRecs } = await supabase
    .from('recommendations')
    .select('id, category, scope_key, status')
    .eq('project_id', projectId)
    .in('status', ['open', 'in_progress'])
    .is('superseded_by', null);

  const existingMap = new Map((existingRecs || []).map((r) => [r.scope_key, r]));

  // 2. Process Detected Issues
  for (const issue of detectedIssues) {
    processedScopeKeys.add(issue.scopeKey);

    // Phrase Title & Description via Gemini or deterministic fallback
    const phrased = await phraseRecommendationWithGemini(issue);

    const existing = existingMap.get(issue.scopeKey);
    let recId: string;

    if (existing) {
      // Refresh Existing Recommendation
      recId = existing.id;
      await supabase
        .from('recommendations')
        .update({
          title: phrased.title,
          description: phrased.description,
          impact_score: issue.impactScore,
          effort_score: issue.effortScore,
          priority: issue.priority,
          generation_method: phrased.generationMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recId);

      // Refresh Evidence Rows
      await supabase.from('recommendation_evidence').delete().eq('recommendation_id', recId);

      for (const ev of issue.evidence) {
        await supabase.from('recommendation_evidence').insert({
          recommendation_id: recId,
          page_id: ev.pageId || null,
          ai_scan_id: ev.aiScanId || null,
          citation_id: ev.citationId || null,
          competitor_id: ev.competitorId || null,
          notes: ev.notes || null,
        });
      }

      updatedCount++;
    } else {
      // Insert New Recommendation
      const firstScanId = issue.evidence.find((e) => e.aiScanId)?.aiScanId || null;

      const { data: insertedRec, error: insertErr } = await supabase
        .from('recommendations')
        .insert({
          project_id: projectId,
          scan_id: firstScanId,
          scope_key: issue.scopeKey,
          title: phrased.title,
          description: phrased.description,
          category: issue.category,
          impact_score: issue.impactScore,
          effort_score: issue.effortScore,
          priority: issue.priority,
          generation_method: phrased.generationMethod,
          status: 'open',
        })
        .select('id')
        .single();

      if (insertErr || !insertedRec) {
        console.error('Failed to insert recommendation:', insertErr);
        continue;
      }

      recId = insertedRec.id;

      // Insert Evidence Rows
      for (const ev of issue.evidence) {
        await supabase.from('recommendation_evidence').insert({
          recommendation_id: recId,
          page_id: ev.pageId || null,
          ai_scan_id: ev.aiScanId || null,
          citation_id: ev.citationId || null,
          competitor_id: ev.competitorId || null,
          notes: ev.notes || null,
        });
      }

      createdCount++;
    }
  }

  // 3. Auto-Resolve Pass (Fixed recommendations where issue no longer fires)
  const now = new Date().toISOString();
  for (const existing of existingRecs || []) {
    if (!processedScopeKeys.has(existing.scope_key)) {
      await supabase
        .from('recommendations')
        .update({
          status: 'resolved',
          resolved_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);

      autoResolvedCount++;
    }
  }

  // 4. Fetch Full Recommendations List
  const recommendations = await getProjectRecommendations(supabase, projectId);

  return {
    projectId,
    detectedCount: detectedIssues.length,
    createdCount,
    updatedCount,
    autoResolvedCount,
    recommendations,
  };
}

/**
 * Fetches recommendations for a project with evidence and derived affected pages.
 */
export async function getProjectRecommendations(
  supabase: SupabaseClient<Database>,
  projectId: string,
  filter?: {
    status?: RecommendationStatus;
    category?: string;
    priority?: RecommendationPriority;
  }
): Promise<Recommendation[]> {
  let query = supabase
    .from('recommendations')
    .select(
      `
      id,
      project_id,
      scan_id,
      category,
      title,
      description,
      impact_score,
      effort_score,
      priority,
      status,
      scope_key,
      generation_method,
      superseded_by,
      resolved_by_scan_id,
      resolved_at,
      created_at,
      updated_at,
      recommendation_evidence (
        id,
        page_id,
        ai_scan_id,
        citation_id,
        competitor_id,
        notes
      )
    `
    )
    .eq('project_id', projectId)
    .is('superseded_by', null);

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }
  if (filter?.category) {
    query = query.eq('category', filter.category);
  }
  if (filter?.priority) {
    query = query.eq('priority', filter.priority);
  }

  const { data: recRows, error } = await query.order('created_at', { ascending: false });

  if (error || !recRows) {
    return [];
  }

  // Fetch URLs for affected page IDs
  const allPageIds = new Set<string>();
  for (const r of recRows) {
    const evidenceItems = Array.isArray(r.recommendation_evidence) ? r.recommendation_evidence : [];
    for (const e of evidenceItems) {
      if (e.page_id) allPageIds.add(e.page_id);
    }
  }

  const pageUrlMap = new Map<string, string>();
  if (allPageIds.size > 0) {
    const { data: pages } = await supabase
      .from('pages')
      .select('id, url')
      .in('id', Array.from(allPageIds));

    (pages || []).forEach((p) => pageUrlMap.set(p.id, p.url));
  }

  return recRows.map((r) => {
    const rawEvidence = Array.isArray(r.recommendation_evidence) ? r.recommendation_evidence : [];
    const evidenceList: EvidenceRef[] = rawEvidence.map((e) => ({
      id: e.id,
      pageId: e.page_id,
      aiScanId: e.ai_scan_id,
      citationId: e.citation_id,
      competitorId: e.competitor_id,
      notes: e.notes,
    }));

    const affectedPages = Array.from(
      new Set(
        evidenceList
          .map((e) => e.pageId && pageUrlMap.get(e.pageId))
          .filter((url): url is string => Boolean(url))
      )
    );

    return {
      id: r.id,
      projectId: r.project_id,
      scanId: r.scan_id,
      category: r.category,
      title: r.title,
      description: r.description,
      impactScore: r.impact_score,
      effortScore: r.effort_score,
      priority: r.priority as RecommendationPriority,
      status: r.status as RecommendationStatus,
      scopeKey: r.scope_key,
      generationMethod: r.generation_method as ExtractionMethod,
      supersededBy: r.superseded_by,
      resolvedByScanId: r.resolved_by_scan_id,
      resolvedAt: r.resolved_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      evidence: evidenceList,
      affectedPages,
    };
  });
}

/**
 * Manually updates a recommendation status (e.g., user marks in_progress, resolved, or dismissed).
 */
export async function updateRecommendationStatus(
  supabase: SupabaseClient<Database>,
  recommendationId: string,
  newStatus: RecommendationStatus
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('recommendations')
    .select('id, status')
    .eq('id', recommendationId)
    .single();

  if (!existing) return false;

  const now = new Date().toISOString();
  const isCurrentlyResolved = (existing.status as string) === 'resolved';

  const updateData: {
    status: RecommendationStatus;
    updated_at: string;
    resolved_at?: string | null;
  } = {
    status: newStatus,
    updated_at: now,
  };

  if (newStatus === 'resolved') {
    updateData.resolved_at = now;
  } else if (isCurrentlyResolved) {
    updateData.resolved_at = null;
  }

  const { error } = await supabase
    .from('recommendations')
    .update(updateData)
    .eq('id', recommendationId);

  return !error;
}
