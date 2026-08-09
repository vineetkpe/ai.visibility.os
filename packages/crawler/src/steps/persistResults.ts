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
 * Persists page crawl metadata and edge links to Supabase.
 * Note: socialProfiles (social_links from extractSocialProfiles.ts's anchor-tag scan) output is currently
 * unused/uncaptured in the DB-04 schema. This is a known simplification versus the old schema.
 */
export async function persistPageResult(
  supabase: SupabaseClient<Database>,
  input: PagePersistInput
): Promise<string | null> {
  const { domainId, crawlResult, metadata, structuredData, links, crawlSessionId } = input;
  const now = new Date().toISOString();

  // 1. Derive project_id from domain lookup
  const { data: domainRow, error: domainError } = await supabase
    .from('domains')
    .select('project_id')
    .eq('id', domainId)
    .single();

  if (domainError || !domainRow || !domainRow.project_id) {
    return null;
  }

  // 2. Insert page record matching DB-04 schema
  let pathname = '/';
  try {
    pathname = new URL(crawlResult.url).pathname || '/';
  } catch {
    pathname = '/';
  }

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .insert({
      project_id: domainRow.project_id,
      domain_id: domainId,
      url: crawlResult.url,
      path: pathname,
      status_code: crawlResult.httpStatus,
      last_crawled_at: now,
    })
    .select('id')
    .single();

  if (pageError || !page) {
    return null;
  }

  // 3. Insert page_metadata record
  await supabase.from('page_metadata').insert({
    page_id: page.id,
    title: metadata?.title ?? null,
    meta_description: metadata?.metaDescription ?? null,
    canonical_url: metadata?.canonicalUrl ?? null,
    language: metadata?.language ?? null,
    schema_json: (structuredData?.jsonLd as unknown as Json) ?? null,
    open_graph: (metadata?.openGraph as unknown as Json) ?? null,
    twitter_cards: (metadata?.twitterCard as unknown as Json) ?? null,
  });

  // 4. Route crawl errors to crawl_errors table if present
  if (crawlResult.crawlError && crawlSessionId) {
    await supabase.from('crawl_errors').insert({
      crawl_session_id: crawlSessionId,
      page_id: page.id,
      url: crawlResult.url,
      error_type: crawlResult.crawlStatus ?? 'unknown',
      error_message: crawlResult.crawlError,
    });
  }

  // Note: extracted page links (links) are uncaptured in the current DB-04 schema.

  return page.id;
}

/**
 * Updates jobs table row with final completion status and summary metrics.
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

  if (status === 'running') {
    updateData.started_at = now;
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = now;
  }

  if (resultPayload) {
    updateData.progress = resultPayload as Json;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  await supabase.from('jobs').update(updateData).eq('id', jobId);
}
