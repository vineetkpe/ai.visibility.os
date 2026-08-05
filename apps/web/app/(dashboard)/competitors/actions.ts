'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import {
  addCompetitor,
  confirmCompetitorSuggestion,
  triggerCompetitorCrawl,
  getCompetitorProfile,
  getCompetitorSuggestions,
  computeTier2Comparison,
  type CompetitorProfile,
  type CompetitorSuggestion,
  type Tier2ComparisonMetrics,
} from '@ai-visibility-os/competitor';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to verify user ownership of a target project using auth.uid() scoping.
 */
async function verifyProjectOwnership(supabase: SupabaseClient<Database>, projectId: string) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Authentication required. Please sign in.');
  }

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (projErr || !project) {
    throw new Error('Project not found or access denied.');
  }

  return user;
}

/**
 * Server action to manually add a tracked competitor.
 */
export async function addCompetitorAction(input: {
  projectId: string;
  name: string;
  websiteUrl: string;
}): Promise<ActionResult<CompetitorProfile>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);

    const profile = await addCompetitor(supabase, {
      projectId: input.projectId,
      name: input.name,
      websiteUrl: input.websiteUrl,
    });

    return { success: true, data: profile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add competitor.';
    return { success: false, error: message };
  }
}

/**
 * Server action to confirm an AI scan co-occurrence competitor suggestion.
 */
export async function confirmSuggestionAction(input: {
  projectId: string;
  name: string;
  domain: string;
}): Promise<ActionResult<CompetitorProfile>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);

    const profile = await confirmCompetitorSuggestion(supabase, {
      projectId: input.projectId,
      name: input.name,
      domain: input.domain,
    });

    return { success: true, data: profile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to confirm competitor suggestion.';
    return { success: false, error: message };
  }
}

/**
 * Server action to trigger Website Discovery crawl for a competitor domain (Tier 2).
 */
export async function triggerCompetitorCrawlAction(input: {
  projectId: string;
  competitorId: string;
}): Promise<ActionResult<{ jobId: string }>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);

    const res = await triggerCompetitorCrawl(supabase, {
      projectId: input.projectId,
      competitorId: input.competitorId,
    });

    return { success: true, data: { jobId: res.jobId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to trigger competitor crawl.';
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch list of tracked competitors with derived profile data for a project.
 */
export async function getCompetitorsOverviewAction(
  projectId: string
): Promise<ActionResult<CompetitorProfile[]>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);

    const { data: comps } = await supabase
      .from('competitors')
      .select('id')
      .eq('project_id', projectId);

    if (!comps || comps.length === 0) {
      return { success: true, data: [] };
    }

    const profiles: CompetitorProfile[] = [];
    for (const c of comps) {
      try {
        const p = await getCompetitorProfile(supabase, c.id);
        profiles.push(p);
      } catch (err) {
        console.warn(`Error fetching profile for competitor ${c.id}:`, err);
      }
    }

    return { success: true, data: profiles };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch competitors overview.';
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch detailed profile & Tier 2 comparison metrics for a single competitor.
 */
export async function getCompetitorDetailsAction(input: {
  projectId: string;
  competitorId: string;
}): Promise<ActionResult<{ profile: CompetitorProfile; tier2Metrics: Tier2ComparisonMetrics }>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, input.projectId);

    const profile = await getCompetitorProfile(supabase, input.competitorId);
    const tier2Metrics = await computeTier2Comparison(supabase, input.projectId, input.competitorId);

    return {
      success: true,
      data: { profile, tier2Metrics },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch competitor details.';
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch competitor suggestions surfaced from scan entity mentions & citations.
 */
export async function getSuggestionsAction(
  projectId: string
): Promise<ActionResult<CompetitorSuggestion[]>> {
  try {
    const supabase = await createClient();
    await verifyProjectOwnership(supabase, projectId);

    const suggestions = await getCompetitorSuggestions(supabase, projectId);
    return { success: true, data: suggestions };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch competitor suggestions.';
    return { success: false, error: message };
  }
}
