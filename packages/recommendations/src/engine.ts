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

export async function runRecommendationEngine(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<RecommendationEngineRunResult> {
  const detectedIssues = await detectProjectIssues(supabase, projectId);

  let createdCount = 0;
  let updatedCount = 0;
  let autoResolvedCount = 0;
  const processedScopeKeys = new Set<string>();

  const { data: existingRecs, error: existingRecsError } = await supabase
    .from('recommendations')
    .select('id, category, scope_key, status')
    .eq('project_id', projectId)
    .in('status', ['open', 'in_progress'])
    .is('superseded_by', null);
  if (existingRecsError) {
    throw new Error(`Failed to load existing recommendations: ${existingRecsError.message}`);
  }

  const existingMap = new Map((existingRecs || []).map((r) => [r.scope_key, r]));

  for (const issue of detectedIssues) {
    processedScopeKeys.add(issue.scopeKey);
    const phrased = await phraseRecommendationWithGemini(issue);
    const existing = existingMap.get(issue.scopeKey);
    let recId: string;

    if (existing) {
      recId = existing.id;
      const { error: updateError } = await supabase
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
      if (updateError) throw new Error(`Failed to update recommendation: ${updateError.message}`);

      const { error: deleteEvidenceError } = await supabase
        .from('recommendation_evidence')
        .delete()
        .eq('recommendation_id', recId);
      if (deleteEvidenceError) {
        throw new Error(`Failed to refresh recommendation evidence: ${deleteEvidenceError.message}`);
      }

      for (const ev of issue.evidence) {
        const { error: evidenceError } = await supabase.from('recommendation_evidence').insert({
          recommendation_id: recId,
          page_id: ev.pageId || null,
          ai_scan_id: ev.aiScanId || null,
          citation_id: ev.citationId || null,
          competitor_id: ev.competitorId || null,
          notes: ev.notes || null,
        });
        if (evidenceError) {
          throw new Error(`Failed to persist recommendation evidence: ${evidenceError.message}`);
        }
      }

      updatedCount++;
    } else {
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
        throw new Error(`Failed to insert recommendation: ${insertErr?.message || 'No recommendation row returned.'}`);
      }

      recId = insertedRec.id;
      for (const ev of issue.evidence) {
        const { error: evidenceError } = await supabase.from('recommendation_evidence').insert({
          recommendation_id: recId,
          page_id: ev.pageId || null,
          ai_scan_id: ev.aiScanId || null,
          citation_id: ev.citationId || null,
          competitor_id: ev.competitorId || null,
          notes: ev.notes || null,
        });
        if (evidenceError) {
          throw new Error(`Failed to persist recommendation evidence: ${evidenceError.message}`);
        }
      }
      createdCount++;
    }
  }

  const now = new Date().toISOString();
  for (const existing of existingRecs || []) {
    if (!processedScopeKeys.has(existing.scope_key)) {
      const { error } = await supabase
        .from('recommendations')
        .update({ status: 'resolved', resolved_at: now, updated_at: now })
        .eq('id', existing.id);
      if (error) throw new Error(`Failed to auto-resolve recommendation: ${error.message}`);
      autoResolvedCount++;
    }
  }

  const recommendations = await getProjectRecommendations(supabase, projectId);
  return { projectId, detectedCount: detectedIssues.length, createdCount, updatedCount, autoResolvedCount, recommendations };
}

export async function getProjectRecommendations(
  supabase: SupabaseClient<Database>,
  projectId: string,
  filter?: { status?: RecommendationStatus; category?: string; priority?: RecommendationPriority }
): Promise<Recommendation[]> {
  let query = supabase
    .from('recommendations')
    .select(`
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
    `)
    .eq('project_id', projectId)
    .is('superseded_by', null);

  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.category) query = query.eq('category', filter.category);
  if (filter?.priority) query = query.eq('priority', filter.priority);

  const { data: recRows, error } = await query.order('created_at', { ascending: false });
  if (error || !recRows) return [];

  const allPageIds = new Set<string>();
  for (const r of recRows) {
    const evidenceItems = Array.isArray(r.recommendation_evidence) ? r.recommendation_evidence : [];
    for (const e of evidenceItems) if (e.page_id) allPageIds.add(e.page_id);
  }

  const pageUrlMap = new Map<string, string>();
  if (allPageIds.size > 0) {
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, url')
      .in('id', Array.from(allPageIds));
    if (pagesError) throw new Error(`Failed to load recommendation page URLs: ${pagesError.message}`);
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

export async function updateRecommendationStatus(
  supabase: SupabaseClient<Database>,
  recommendationId: string,
  newStatus: RecommendationStatus
): Promise<boolean> {
  const { data: existing, error: fetchError } = await supabase
    .from('recommendations')
    .select('id, status')
    .eq('id', recommendationId)
    .single();

  if (fetchError || !existing) return false;

  const now = new Date().toISOString();
  const isCurrentlyResolved = (existing.status as string) === 'resolved';
  const updateData: { status: RecommendationStatus; updated_at: string; resolved_at?: string | null } = {
    status: newStatus,
    updated_at: now,
  };

  if (newStatus === 'resolved') updateData.resolved_at = now;
  else if (isCurrentlyResolved) updateData.resolved_at = null;

  const { error } = await supabase
    .from('recommendations')
    .update(updateData)
    .eq('id', recommendationId);

  return !error;
}
