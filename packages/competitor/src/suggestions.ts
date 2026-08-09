import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { CompetitorSuggestion, SuggestionEvidence } from './types';

/**
 * Queries entity mentions and citations across completed scans for a project,
 * suggesting untracked brand/domain entities with underlying scan evidence.
 * Suggested or dismissed competitors are NOT treated as active competitors.
 */
export async function getCompetitorSuggestions(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<CompetitorSuggestion[]> {
  // 1. Fetch existing project competitors (all statuses to prevent duplicate suggestions)
  const { data: existingComps } = await supabase
    .from('competitors')
    .select('name, domains!inner(host)')
    .eq('project_id', projectId);

  const trackedDomains = new Set<string>();
  const trackedNames = new Set<string>();

  if (existingComps) {
    for (const c of existingComps) {
      const host = (c.domains as unknown as { host: string }).host;
      if (host) {
        trackedDomains.add(host.toLowerCase().replace(/^www\./, ''));
      }
      if (c.name) {
        trackedNames.add(c.name.toLowerCase());
      }
    }
  }

  // 2. Fetch primary own domain
  const { data: ownDomains } = await supabase
    .from('domains')
    .select('host')
    .eq('project_id', projectId)
    .eq('is_primary', true);

  if (ownDomains) {
    for (const d of ownDomains) {
      trackedDomains.add(d.host.toLowerCase().replace(/^www\./, ''));
    }
  }

  // 3. Fetch completed scans for project
  const { data: scans } = await supabase
    .from('ai_scans')
    .select('id, prompt_text')
    .eq('project_id', projectId)
    .eq('status', 'completed');

  if (!scans || scans.length === 0) {
    return [];
  }

  const scanIds = scans.map((s) => s.id);
  const scanMap = new Map(scans.map((s) => [s.id, s.prompt_text]));

  // Map to hold aggregated candidate suggestions by domain
  const suggestionMap = new Map<
    string,
    {
      name: string;
      domain: string;
      scansSeen: Set<string>;
      evidence: SuggestionEvidence[];
    }
  >();

  // A. Analyze Citations (unlinked non-own domain citations)
  const { data: citations } = await supabase
    .from('citations')
    .select('ai_scan_id, url')
    .in('ai_scan_id', scanIds)
    .eq('is_own_domain', false)
    .is('competitor_id', null);

  if (citations) {
    for (const c of citations) {
      try {
        const parsedUrl = new URL(c.url);
        const cleanDomain = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
        if (trackedDomains.has(cleanDomain)) continue;
        // Filter out generic search engine domains or social platforms
        if (['google.com', 'wikipedia.org', 'youtube.com', 'reddit.com', 'github.com'].includes(cleanDomain)) {
          continue;
        }

        const existing = suggestionMap.get(cleanDomain);
        const promptText = scanMap.get(c.ai_scan_id);

        const evidenceItem: SuggestionEvidence = {
          type: 'citation',
          scanId: c.ai_scan_id,
          promptText,
          sourceUrl: c.url,
        };

        if (existing) {
          existing.scansSeen.add(c.ai_scan_id);
          if (existing.evidence.length < 5) existing.evidence.push(evidenceItem);
        } else {
          // Derive formatted name from domain (e.g. "acme.com" -> "Acme")
          const derivedName = cleanDomain.split('.')[0] || cleanDomain;
          const nameFormatted = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

          suggestionMap.set(cleanDomain, {
            name: nameFormatted,
            domain: cleanDomain,
            scansSeen: new Set([c.ai_scan_id]),
            evidence: [evidenceItem],
          });
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  }

  // B. Analyze Entity Mentions
  const { data: mentions } = await supabase
    .from('entity_mentions')
    .select('ai_scan_id, context_snippet, tracked_entities!inner(name, entity_type)')
    .in('ai_scan_id', scanIds);

  if (mentions) {
    for (const m of mentions) {
      if (!m.ai_scan_id) continue;
      const entObj = (m.tracked_entities as unknown as { name: string; entity_type: string }) || {};
      const entName = entObj.name;
      const entType = entObj.entity_type;

      if (
        !entName ||
        (entType !== 'brand' && entType !== 'organization')
      ) {
        continue;
      }

      const lowerName = entName.toLowerCase();
      if (trackedNames.has(lowerName)) continue;

      const mockDomain = `${lowerName.replace(/[^a-z0-9]/g, '')}.com`;
      if (trackedDomains.has(mockDomain)) continue;

      const existing = suggestionMap.get(mockDomain);
      const promptText = scanMap.get(m.ai_scan_id);

      const evidenceItem: SuggestionEvidence = {
        type: 'entity_mention',
        scanId: m.ai_scan_id,
        promptText,
        contextSnippet: m.context_snippet || undefined,
      };

      if (existing) {
        existing.scansSeen.add(m.ai_scan_id);
        if (existing.evidence.length < 5) existing.evidence.push(evidenceItem);
      } else {
        suggestionMap.set(mockDomain, {
          name: entName,
          domain: mockDomain,
          scansSeen: new Set([m.ai_scan_id]),
          evidence: [evidenceItem],
        });
      }
    }
  }

  // Format into final suggestions sorted by co-occurrence count
  const results: CompetitorSuggestion[] = Array.from(suggestionMap.values())
    .map((s) => ({
      name: s.name,
      domain: s.domain,
      coOccurrenceCount: s.scansSeen.size,
      evidence: s.evidence,
    }))
    .sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount);

  return results.slice(0, 10);
}
