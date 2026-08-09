import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  Recommendation,
  RecommendationEngineRunResult,
  RecommendationStatus,
  RecommendationCategory,
  PriorityBand,
  EstimatedImpact,
  EstimatedEffort,
  GenerationMethod,
} from './types';
import { detectProjectIssues } from './rules';
import { determineImpactBand, determinePriorityBand, computeConfidenceScore } from './formula';
import { phraseRecommendationWithGemini } from './phrasing';

/**
 * Main AI Recommendation Engine Pipeline.
 * Detects issues from real evidence, scores impact & effort, phrases recommendations,
 * deduplicates against open issues, and auto-resolves fixed recommendations.
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
    .in('status', ['open', 'in_progress']);

  const existingMap = new Map((existingRecs || []).map((r) => [r.scope_key, r]));

  // 2. Process Detected Issues
  for (const issue of detectedIssues) {
    processedScopeKeys.add(issue.scopeKey);

    const impactBand = determineImpactBand(issue.rawImpactScore);
    const priorityBand = determinePriorityBand(impactBand, issue.effort);
    const confidenceScore = computeConfidenceScore(issue.evidence.length);

    // Phrase Title & Summary
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
          description: phrased.summary,
          priority: priorityBand,
          estimated_impact: impactBand,
          estimated_effort: issue.effort,
          confidence_score: confidenceScore,
          implementation_steps: phrased.implementationSteps,
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
          scan_id: ev.scanId || null,
          citation_id: ev.citationId || null,
          competitor_scan_id: ev.competitorScanId || null,
          evidence_description: ev.description,
        });
      }

      // Log History
      await supabase.from('recommendation_history').insert({
        recommendation_id: recId,
        previous_status: existing.status,
        new_status: existing.status,
        reason: 'evidence_still_present',
      });

      updatedCount++;
    } else {
      // Insert New Recommendation
      const firstScanId = issue.evidence.find((e) => e.scanId)?.scanId || null;

      const { data: insertedRec, error: insertErr } = await supabase
        .from('recommendations')
        .insert({
          project_id: projectId,
          scan_id: firstScanId,
          scope_key: issue.scopeKey,
          title: phrased.title,
          description: phrased.summary,
          category: issue.category,
          priority: priorityBand,
          estimated_impact: impactBand,
          estimated_effort: issue.effort,
          confidence_score: confidenceScore,
          implementation_steps: phrased.implementationSteps,
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
          scan_id: ev.scanId || null,
          citation_id: ev.citationId || null,
          competitor_scan_id: ev.competitorScanId || null,
          evidence_description: ev.description,
        });
      }

      // Log History
      await supabase.from('recommendation_history').insert({
        recommendation_id: recId,
        previous_status: null,
        new_status: 'open',
        reason: 'created',
      });

      createdCount++;
    }
  }

  // 3. Re-evaluation Pass (Auto-Resolve fixed recommendations)
  for (const existing of existingRecs || []) {
    if (!processedScopeKeys.has(existing.scope_key)) {
      // Issue no longer fires against current evidence -> Auto-Resolve
      await supabase
        .from('recommendations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      await supabase.from('recommendation_history').insert({
        recommendation_id: existing.id,
        previous_status: existing.status,
        new_status: 'completed',
        reason: 'auto_resolved',
      });

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
    category?: RecommendationCategory;
    priority?: PriorityBand;
  }
): Promise<Recommendation[]> {
  let query = supabase
    .from('recommendations')
    .select(
      `
      id,
      project_id,
      scan_id,
      scope_key,
      title,
      description,
      category,
      priority,
      estimated_impact,
      estimated_effort,
      confidence_score,
      implementation_steps,
      generation_method,
      status,
      created_at,
      recommendation_evidence (
        id,
        page_id,
        scan_id,
        citation_id,
        competitor_scan_id,
        evidence_description
      )
    `
    )
    .eq('project_id', projectId);

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
  (recRows as any[]).forEach((r: any) => {
    ((r.recommendation_evidence || []) as any[]).forEach((e: any) => {
      if (e.page_id) allPageIds.add(e.page_id);
    });
  });

  const pageUrlMap = new Map<string, string>();
  if (allPageIds.size > 0) {
    const { data: pages } = await supabase
      .from('pages')
      .select('id, url')
      .in('id', Array.from(allPageIds));

    (pages || []).forEach((p) => pageUrlMap.set(p.id, p.url));
  }

  return (recRows as any[]).map((r: any) => {
    const evidenceList = ((r.recommendation_evidence || []) as any[]).map((e: any) => ({
      id: e.id,
      pageId: e.page_id,
      scanId: e.scan_id,
      citationId: e.citation_id,
      competitorScanId: e.competitor_scan_id,
      description: e.evidence_description,
    }));

    const affectedPages = Array.from(
      new Set(
        evidenceList
          .map((e) => e.pageId && pageUrlMap.get(e.pageId))
          .filter((url): url is string => Boolean(url))
      )
    );

    const steps = Array.isArray(r.implementation_steps) ? (r.implementation_steps as string[]) : [];

    return {
      id: r.id,
      projectId: r.project_id,
      scanId: r.scan_id,
      scopeKey: r.scope_key,
      title: r.title,
      summary: r.description,
      category: r.category as RecommendationCategory,
      priority: r.priority as PriorityBand,
      estimatedImpact: (r.estimated_impact || 'medium') as EstimatedImpact,
      estimatedEffort: (r.estimated_effort || 'moderate') as EstimatedEffort,
      confidenceScore: r.confidence_score || 0.8,
      generationMethod: r.generation_method as GenerationMethod,
      status: r.status as RecommendationStatus,
      evidence: evidenceList,
      affectedPages,
      implementationSteps: steps,
      generatedAt: r.created_at,
    };
  });
}

/**
 * Manually updates a recommendation status (e.g., user marks in_progress, completed, or dismissed).
 */
export async function updateRecommendationStatus(
  supabase: SupabaseClient<Database>,
  recommendationId: string,
  newStatus: RecommendationStatus,
  reason = 'user_action'
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('recommendations')
    .select('id, status')
    .eq('id', recommendationId)
    .single();

  if (!existing) return false;

  await supabase
    .from('recommendations')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId);

  await supabase.from('recommendation_history').insert({
    recommendation_id: recommendationId,
    previous_status: existing.status,
    new_status: newStatus,
    reason,
  });

  return true;
}
