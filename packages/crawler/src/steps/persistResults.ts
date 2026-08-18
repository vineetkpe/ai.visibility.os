import type { SupabaseClient, Database, Json } from '@ai-visibility-os/database';
import type {
  PageCrawlResult,
  PageMetadata,
  StructuredDataResult,
  ExtractedLink,
  SocialProfilesResult,
} from '../types';

export interface PagePersistInput {
  domainId: string;
  crawlResult: PageCrawlResult;
  metadata?: PageMetadata;
  structuredData?: StructuredDataResult;
  links?: ExtractedLink[];
  socialProfiles?: SocialProfilesResult;
  crawlSessionId?: string;
}

/**
 * Persists the durable page snapshot produced by the crawler.
 *
 * Important reliability rule: database write failures are surfaced to the caller
 * instead of being silently converted into `null`. The pipeline can then count
 * the page as failed (and the worker can retry the job) rather than reporting a
 * successful crawl with missing persistence.
 */
export async function persistPageResult(
  supabase: SupabaseClient<Database>,
  input: PagePersistInput
): Promise<string | null> {
  const { domainId, crawlResult, metadata, structuredData, crawlSessionId } = input;
  const now = new Date().toISOString();

  // 1. Derive project_id from domain lookup.
  const { data: domainRow, error: domainError } = await supabase
    .from('domains')
    .select('project_id')
    .eq('id', domainId)
    .single();

  if (domainError || !domainRow?.project_id) {
    throw new Error(
      `Failed to resolve project for domain ${domainId}: ${domainError?.message || 'domain not found.'}`
    );
  }

  // 2. Upsert the page. DB-04 defines (project_id, url) as the canonical page key.
  let pathname = '/';
  try {
    pathname = new URL(crawlResult.url).pathname || '/';
  } catch {
    pathname = '/';
  }

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .upsert(
      {
        project_id: domainRow.project_id,
        domain_id: domainId,
        url: crawlResult.url,
        path: pathname,
        status_code: crawlResult.httpStatus,
        last_crawled_at: now,
      },
      { onConflict: 'project_id,url' }
    )
    .select('id')
    .single();

  if (pageError || !page) {
    throw new Error(
      `Failed to persist page ${crawlResult.url}: ${pageError?.message || 'no page row returned.'}`
    );
  }

  // 3. Upsert the current metadata snapshot for the page.
  const { error: metadataError } = await supabase
    .from('page_metadata')
    .upsert(
      {
        page_id: page.id,
        title: metadata?.title ?? null,
        meta_description: metadata?.metaDescription ?? null,
        canonical_url: metadata?.canonicalUrl ?? null,
        language: metadata?.language ?? null,
        schema_json: (structuredData?.jsonLd as unknown as Json) ?? null,
        open_graph: (metadata?.openGraph as unknown as Json) ?? null,
        twitter_cards: (metadata?.twitterCard as unknown as Json) ?? null,
      },
      { onConflict: 'page_id' }
    );

  if (metadataError) {
    throw new Error(
      `Failed to persist metadata for page ${page.id}: ${metadataError.message}`
    );
  }

  // 4. Preserve crawl errors as append-only evidence.
  if (crawlResult.crawlError && crawlSessionId) {
    const { error: crawlErrorInsertError } = await supabase.from('crawl_errors').insert({
      crawl_session_id: crawlSessionId,
      page_id: page.id,
      url: crawlResult.url,
      error_type: crawlResult.crawlStatus ?? 'unknown',
      error_message: crawlResult.crawlError,
    });

    if (crawlErrorInsertError) {
      throw new Error(
        `Failed to persist crawl error for page ${page.id}: ${crawlErrorInsertError.message}`
      );
    }
  }

  // Extracted links/social profiles are intentionally not persisted yet because
  // the current DB-04 schema has no destination table for them. Keep accepting
  // the extraction output so the storage contract can be added without changing
  // the crawler pipeline API.

  return page.id;
}

/**
 * Updates a job row and fails loudly if the status/progress write itself fails.
 * A worker must never report a durable job state that the database rejected.
 */
export async function updateJobStatus(
  supabase: SupabaseClient<Database>,
  jobId: string,
  status: 'running' | 'completed' | 'failed',
  resultPayload?: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();
  const updateData: Database['public']['Tables']['jobs']['Update'] = {
    status,
    updated_at: now,
  };

  if (status === 'running') updateData.started_at = now;
  if (status === 'completed' || status === 'failed') updateData.completed_at = now;
  if (resultPayload) updateData.progress = resultPayload as Json;
  if (errorMessage) updateData.error_message = errorMessage;

  const { error } = await supabase.from('jobs').update(updateData).eq('id', jobId);

  if (error) {
    throw new Error(`Failed to persist job ${jobId} status=${status}: ${error.message}`);
  }
}
