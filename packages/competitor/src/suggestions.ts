import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type { CompetitorSuggestion, SuggestionEvidence } from './types';

/**
 * Queries entity mentions and citations across completed scans for a project,
 * suggesting untracked brand/domain entities with underlying scan evidence.
 */
export async function getCompetitorSuggestions(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<CompetitorSuggestion[]> {
  // 1. Fetch existing project competitors
  const { data: existingComps } = await supabase
    .from('competitors')
    .select('domain_name, name')
    .eq('project_id', projectId);

  const trackedDomains = new Set(
    (existingComps || []).map((c) => c.domain_name.toLowerCase().replace(/^www\./, ''))
  );
  const trackedNames = new Set(
    (existingComps || []).map((c) => c.name.toLowerCase())
  );

  // 2. Fetch primary own domain
  const { data: ownDomains } = await supabase
    .from('domains')
    .select('host')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .is('deleted_at', null);

  if (ownDomains) {
    for (const d of ownDomains) {
      trackedDomains.add(d.host.toLowerCase().replace(/^www\./, ''));
    }
  }

  // 3. Fetch completed scans for project
  const { data: scans } = await supabase
    .from('scans')
    .select('id, query_prompt')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .is('deleted_at', null);

  if (!scans || scans.length === 0) {
    return [];
  }

  const scanIds = scans.map((s) => s.id);
  const scanMap = new Map(scans.map((s) => [s.id, s.query_prompt]));

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

  // A. Analyze Citations
  const { data: citations } = await supabase
    .from('citations')
    .select('scan_id, source_url, source_domain')
    .in('scan_id', scanIds)
    .eq('is_own_domain', false);

  if (citations) {
    for (const c of citations) {
      const cleanDomain = c.source_domain.toLowerCase().replace(/^www\./, '');
      if (trackedDomains.has(cleanDomain)) continue;
      // Filter out generic search engine domains or social platforms if desired
      if (['google.com', 'wikipedia.org', 'youtube.com', 'reddit.com'].includes(cleanDomain)) continue;

      const existing = suggestionMap.get(cleanDomain);
      const promptText = scanMap.get(c.scan_id);

      const evidenceItem: SuggestionEvidence = {
        type: 'citation',
        scanId: c.scan_id,
        promptText,
        sourceUrl: c.source_url,
      };

      if (existing) {
        existing.scansSeen.add(c.scan_id);
        if (existing.evidence.length < 5) existing.evidence.push(evidenceItem);
      } else {
        // Derive name from domain (e.g. "acme.com" -> "Acme")
        const derivedName = cleanDomain.split('.')[0] || cleanDomain;
        const nameFormatted = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

        suggestionMap.set(cleanDomain, {
          name: nameFormatted,
          domain: cleanDomain,
          scansSeen: new Set([c.scan_id]),
          evidence: [evidenceItem],
        });
      }
    }
  }

  // B. Analyze Entity Mentions
  const { data: mentions } = await supabase
    .from('entity_mentions')
    .select('scan_id, context_snippet, entities!inner(name, entity_type)')
    .in('scan_id', scanIds);

  if (mentions) {
    for (const m of mentions) {
      if (!m.scan_id) continue;
      const entName = Array.isArray(m.entities) ? m.entities[0]?.name : (m.entities as { name?: string })?.name;
      const entType = Array.isArray(m.entities) ? m.entities[0]?.entity_type : (m.entities as { entity_type?: string })?.entity_type;

      if (!entName || entType !== 'brand' && entType !== 'product' && entType !== 'organization') {
        continue;
      }

      const lowerName = entName.toLowerCase();
      if (trackedNames.has(lowerName)) continue;

      const mockDomain = `${lowerName.replace(/[^a-z0-9]/g, '')}.com`;
      if (trackedDomains.has(mockDomain)) continue;

      const existing = suggestionMap.get(mockDomain);
      const promptText = scanMap.get(m.scan_id);

      const evidenceItem: SuggestionEvidence = {
        type: 'entity_mention',
        scanId: m.scan_id,
        promptText,
        contextSnippet: m.context_snippet || undefined,
      };

      if (existing) {
        existing.scansSeen.add(m.scan_id);
        if (existing.evidence.length < 5) existing.evidence.push(evidenceItem);
      } else {
        suggestionMap.set(mockDomain, {
          name: entName,
          domain: mockDomain,
          scansSeen: new Set([m.scan_id]),
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
