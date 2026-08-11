import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import type {
  JoinedPageRecord,
  BusinessContextPipelineOptions,
  BusinessContextPipelineResult,
  ExtractedEntity,
  ExtractedTopic,
  ExtractedProduct,
  ExtractedService,
  ExtractedTechnology,
} from './types';
import { extractDeterministicFields } from './deterministic';
import { synthesizeBusinessContextWithAi } from './ai-synthesis';

/**
 * Deduplicates entities by (entity_type, name).
 */
function deduplicateEntities(list: ExtractedEntity[]): ExtractedEntity[] {
  const map = new Map<string, ExtractedEntity>();
  for (const item of list) {
    const key = `${item.entity_type}:${item.name.toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicates topics by name.
 */
function deduplicateTopics(list: ExtractedTopic[]): ExtractedTopic[] {
  const map = new Map<string, ExtractedTopic>();
  for (const item of list) {
    const key = item.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicates products by name.
 */
function deduplicateProducts(list: ExtractedProduct[]): ExtractedProduct[] {
  const map = new Map<string, ExtractedProduct>();
  for (const item of list) {
    const key = item.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicates services by name.
 */
function deduplicateServices(list: ExtractedService[]): ExtractedService[] {
  const map = new Map<string, ExtractedService>();
  for (const item of list) {
    const key = item.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicates technologies by name.
 */
function deduplicateTechnologies(list: ExtractedTechnology[]): ExtractedTechnology[] {
  const map = new Map<string, ExtractedTechnology>();
  for (const item of list) {
    const key = item.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Executes the Business Context Engine pipeline for a target project against the CURRENT schema.
 */
export async function runBusinessContextPipeline(
  supabase: SupabaseClient<Database>,
  options: BusinessContextPipelineOptions
): Promise<BusinessContextPipelineResult> {
  const startTime = Date.now();
  const { projectId, jobId } = options;

  if (jobId) {
    await supabase.from('jobs').update({ status: 'running' }).eq('id', jobId);
  }

  const finish = async (result: BusinessContextPipelineResult): Promise<BusinessContextPipelineResult> => {
    if (jobId) {
      if (result.status === 'failed') {
        await supabase
          .from('jobs')
          .update({ status: 'failed', error_message: result.error || 'Business context generation failed.' })
          .eq('id', jobId);
      } else {
        await supabase
          .from('jobs')
          .update({ status: 'completed' })
          .eq('id', jobId);
      }
    }
    return result;
  };

  try {
    // 1. Fetch active domains for the project
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId)
      .limit(1);

    if (domainError || !domains || domains.length === 0) {
      return finish({
        projectId,
        contextVersionId: '',
        versionNumber: 0,
        entitiesCount: 0,
        topicsCount: 0,
        productsCount: 0,
        servicesCount: 0,
        technologiesCount: 0,
        status: 'failed',
        error: 'No domain found for project.',
      });
    }

    const domainId = domains[0]?.id as string;

    // 2. Fetch crawled pages with joined page_metadata
    const { data: rawPages, error: pagesError } = await supabase
      .from('pages')
      .select(`
        id,
        url,
        path,
        status_code,
        content_type,
        last_crawled_at,
        page_metadata (
          title,
          meta_description,
          canonical_url,
          language,
          schema_json,
          open_graph,
          twitter_cards
        )
      `)
      .eq('domain_id', domainId)
      .order('created_at', { ascending: true });

    let pages: JoinedPageRecord[] = [];
    if (rawPages && rawPages.length > 0) {
      pages = rawPages as unknown as JoinedPageRecord[];
    } else {
      // If no pages crawled yet, fetch domain & project details to construct synthetic initial page
      const { data: domainObj } = await supabase
        .from('domains')
        .select('host, project_id, projects(name)')
        .eq('id', domainId)
        .maybeSingle();

      const host = domainObj?.host || 'example.com';
      const projName = (domainObj?.projects as unknown as { name?: string } | null)?.name || host;

      pages = [
        {
          id: 'synthetic-initial-page',
          url: `https://${host}`,
          path: '/',
          status_code: 200,
          content_type: 'text/html',
          last_crawled_at: new Date().toISOString(),
          page_metadata: {
            title: `${projName} | Official Website`,
            meta_description: `Official website, products, and services for ${projName}.`,
            canonical_url: `https://${host}`,
            language: 'en',
            schema_json: null,
            open_graph: null,
            twitter_cards: null,
          },
        },
      ];
    }

    // 3. Run Deterministic Pass
    const deterministicResult = extractDeterministicFields(pages);

    // 4. Run AI Synthesis Pass
    const aiResult = await synthesizeBusinessContextWithAi(pages);

    // 5. Combine and deduplicate extracted entities, topics, products, services
    const combinedEntities = deduplicateEntities([
      ...deterministicResult.entities,
      ...(aiResult?.entities || []),
    ]);

    const combinedTopics = deduplicateTopics([
      ...deterministicResult.topics,
      ...(aiResult?.topics || []),
    ]);

    const combinedProducts = deduplicateProducts([
      ...deterministicResult.products,
      ...(aiResult?.products || []),
    ]);

    const combinedServices = deduplicateServices([
      ...deterministicResult.services,
      ...(aiResult?.services || []),
    ]);

    const combinedTechnologies = deduplicateTechnologies([
      ...deterministicResult.technologies,
      ...(aiResult?.technologies || []),
    ]);

    const industry = aiResult?.industry || deterministicResult.industry;
    const description = aiResult?.description || deterministicResult.description;
    const valueProposition = aiResult?.value_proposition || deterministicResult.value_proposition;
    const targetAudience = aiResult?.target_audience || deterministicResult.target_audience;
    const extractionMethod = aiResult ? 'ai_assisted' : 'deterministic';
    const confidenceScore = aiResult?.confidence_score ?? deterministicResult.confidence_score;

    // 6. Calculate version number for reporting (count of existing rows + 1)
    const { count: existingVersionsCount } = await supabase
      .from('business_context_versions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const versionNumber = (existingVersionsCount ?? 0) + 1;
    const durationMs = Date.now() - startTime;

    // 7. Insert new row into business_context_versions
    const { data: newVersion, error: versionInsertError } = await supabase
      .from('business_context_versions')
      .insert({
        project_id: projectId,
        industry,
        description,
        value_proposition: valueProposition,
        target_audience: targetAudience,
        extraction_method: extractionMethod,
        confidence_score: confidenceScore,
        generation_duration_ms: durationMs,
      })
      .select('id')
      .single();

    if (versionInsertError || !newVersion) {
      return finish({
        projectId,
        contextVersionId: '',
        versionNumber,
        entitiesCount: 0,
        topicsCount: 0,
        productsCount: 0,
        servicesCount: 0,
        technologiesCount: 0,
        status: 'failed',
        error: versionInsertError?.message || 'Failed to create business_context_versions record.',
      });
    }

    const versionId = newVersion.id;

    // 8. Insert child records into normalized schema tables
    if (combinedEntities.length > 0) {
      const entityRows = combinedEntities.map((e) => ({
        business_context_version_id: versionId,
        entity_type: e.entity_type,
        name: e.name,
        description: e.description,
        source_page_id: e.source_page_id,
        extraction_method: e.extraction_method,
        confidence_score: e.confidence_score,
      }));
      await supabase.from('entities').insert(entityRows);
    }

    if (combinedTopics.length > 0) {
      const topicRows = combinedTopics.map((t) => ({
        business_context_version_id: versionId,
        name: t.name,
        relevance_score: t.relevance_score,
        source_page_id: t.source_page_id,
        extraction_method: t.extraction_method,
      }));
      await supabase.from('topics').insert(topicRows);
    }

    if (combinedProducts.length > 0) {
      const productRows = combinedProducts.map((p) => ({
        business_context_version_id: versionId,
        name: p.name,
        description: p.description,
        category: p.category,
        url: p.url,
        source_page_id: p.source_page_id,
        extraction_method: p.extraction_method,
        confidence_score: p.confidence_score,
      }));
      await supabase.from('products').insert(productRows);
    }

    if (combinedServices.length > 0) {
      const serviceRows = combinedServices.map((s) => ({
        business_context_version_id: versionId,
        name: s.name,
        description: s.description,
        category: s.category,
        url: s.url,
        source_page_id: s.source_page_id,
        extraction_method: s.extraction_method,
        confidence_score: s.confidence_score,
      }));
      await supabase.from('services').insert(serviceRows);
    }

    if (combinedTechnologies.length > 0) {
      const techRows = combinedTechnologies.map((tech) => ({
        domain_id: domainId,
        name: tech.name,
        category: tech.category,
        source_page_id: tech.source_page_id,
      }));
      for (const row of techRows) {
        await supabase
          .from('technologies')
          .upsert(row, { onConflict: 'domain_id, name' });
      }
    }

    return finish({
      projectId,
      contextVersionId: versionId,
      versionNumber,
      entitiesCount: combinedEntities.length,
      topicsCount: combinedTopics.length,
      productsCount: combinedProducts.length,
      servicesCount: combinedServices.length,
      technologiesCount: combinedTechnologies.length,
      status: 'completed',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Business Context pipeline error.';
    return finish({
      projectId,
      contextVersionId: '',
      versionNumber: 0,
      entitiesCount: 0,
      topicsCount: 0,
      productsCount: 0,
      servicesCount: 0,
      technologiesCount: 0,
      status: 'failed',
      error: errorMsg,
    });
  }
}
