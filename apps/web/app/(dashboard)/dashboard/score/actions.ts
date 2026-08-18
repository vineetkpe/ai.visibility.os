'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database, SupabaseClient } from '@ai-visibility-os/database';

export interface ScoreMetric {
  id: string;
  name: string;
  weight: number;
  score: number;
  description: string;
  formula: string;
  evidence: string;
}

export interface ScoreAnalyticsData {
  project: { id: string; name: string; primaryDomain: string | null };
  compositeScore: number | null;
  completedScans: number;
  metrics: ScoreMetric[];
  models: Array<{ name: string; scans: number; score: number | null }>;
  dataStatus: 'ready' | 'insufficient_data';
}

async function getProject(supabase: SupabaseClient<Database>, projectId?: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Authentication required.');

  let query = supabase
    .from('projects')
    .select('id, name, domains(id, host, is_primary)')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (projectId) query = query.eq('id', projectId);
  else query = query.order('created_at', { ascending: false }).limit(1);

  const { data: project, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return project;
}

export async function getScoreAnalyticsData(projectId?: string): Promise<{
  success: boolean;
  data?: ScoreAnalyticsData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const project = await getProject(supabase, projectId);
    if (!project) return { success: false, error: 'Project not found.' };

    const primaryDomain = project.domains?.find((d) => d.is_primary)?.host || project.domains?.[0]?.host || null;

    const { data: scans, error: scansError } = await supabase
      .from('ai_scans')
      .select('id, model_name, is_mentioned, mention_position, sentiment, completed_at')
      .eq('project_id', project.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (scansError) throw new Error(scansError.message);

    const completedScans = scans || [];
    const scanIds = completedScans.map((s) => s.id);

    const { data: citations, error: citationsError } = scanIds.length
      ? await supabase
          .from('citations')
          .select('ai_scan_id, position, is_own_domain')
          .in('ai_scan_id', scanIds)
      : { data: [], error: null };

    if (citationsError) throw new Error(citationsError.message);

    const citationRows = citations || [];
    const total = completedScans.length;

    if (total === 0) {
      return {
        success: true,
        data: {
          project: { id: project.id, name: project.name, primaryDomain },
          compositeScore: null,
          completedScans: 0,
          metrics: [],
          models: [],
          dataStatus: 'insufficient_data',
        },
      };
    }

    const mentioned = completedScans.filter((s) => s.is_mentioned).length;
    const ownCitationScanIds = new Set(
      citationRows.filter((c) => c.is_own_domain).map((c) => c.ai_scan_id),
    );

    // All metrics are derived only from persisted scan/citation records.
    const mentionRate = (mentioned / total) * 100;
    const citationFrequency = (ownCitationScanIds.size / total) * 100;

    const mentionedWithPosition = completedScans.filter(
      (s) => s.is_mentioned && typeof s.mention_position === 'number' && s.mention_position > 0,
    );
    const positionScore = mentionedWithPosition.length
      ? Math.max(
          0,
          Math.min(
            100,
            mentionedWithPosition.reduce((sum, s) => sum + 100 / Math.max(1, s.mention_position as number), 0) /
              mentionedWithPosition.length,
          ),
        )
      : 0;

    const sentimentScored = completedScans.filter((s) => s.sentiment !== null && s.sentiment !== undefined);
    const sentimentScore = sentimentScored.length
      ? (sentimentScored.filter((s) => s.sentiment === 'positive').length / sentimentScored.length) * 100
      : null;

    const metrics: ScoreMetric[] = [
      {
        id: 'citation_frequency',
        name: 'Citation Frequency',
        weight: 35,
        score: Math.round(citationFrequency),
        description: 'Share of completed scans where at least one persisted citation identifies your domain as the source.',
        formula: 'Scans with own-domain citation / Completed scans × 100',
        evidence: `${ownCitationScanIds.size} of ${total} completed scans have an own-domain citation.`,
      },
      {
        id: 'mention_rate',
        name: 'Brand Mention Rate',
        weight: 25,
        score: Math.round(mentionRate),
        description: 'Share of completed model responses that explicitly mention the tracked brand.',
        formula: 'Mentioned scans / Completed scans × 100',
        evidence: `${mentioned} of ${total} completed scans mention the brand.`,
      },
      {
        id: 'citation_position',
        name: 'Citation Position',
        weight: 20,
        score: Math.round(positionScore),
        description: 'Rewards earlier persisted citation positions when the brand is mentioned.',
        formula: 'Average of 100 / citation position for mentioned scans',
        evidence: mentionedWithPosition.length
          ? `${mentionedWithPosition.length} mentioned scans contain a persisted citation position.`
          : 'No persisted citation positions are available yet.',
      },
      {
        id: 'positive_sentiment',
        name: 'Positive Sentiment Rate',
        weight: 20,
        score: sentimentScore === null ? 0 : Math.round(sentimentScore),
        description: 'Share of completed scans with a persisted positive sentiment classification.',
        formula: 'Positive sentiment scans / scans with sentiment × 100',
        evidence: sentimentScore === null
          ? 'No persisted sentiment classifications are available yet.'
          : `${sentimentScored.filter((s) => s.sentiment === 'positive').length} of ${sentimentScored.length} scored scans are positive.`,
      },
    ];

    const hasEnoughData = total >= 3;
    const compositeScore = hasEnoughData
      ? Math.round(metrics.reduce((sum, metric) => sum + metric.score * (metric.weight / 100), 0))
      : null;

    const modelMap = new Map<string, { scans: number; mentioned: number }>();
    completedScans.forEach((scan) => {
      const name = scan.model_name || 'Unknown model';
      const entry = modelMap.get(name) || { scans: 0, mentioned: 0 };
      entry.scans += 1;
      if (scan.is_mentioned) entry.mentioned += 1;
      modelMap.set(name, entry);
    });

    const models = Array.from(modelMap.entries()).map(([name, value]) => ({
      name,
      scans: value.scans,
      score: Math.round((value.mentioned / value.scans) * 100),
    }));

    return {
      success: true,
      data: {
        project: { id: project.id, name: project.name, primaryDomain },
        compositeScore,
        completedScans: total,
        metrics,
        models,
        dataStatus: hasEnoughData ? 'ready' : 'insufficient_data',
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to calculate score.' };
  }
}
