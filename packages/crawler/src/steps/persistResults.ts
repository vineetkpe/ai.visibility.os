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
}

/**
 * Persists page crawl metadata and edge links to Supabase.
 */
export async function persistPageResult(
  supabase: SupabaseClient<Database>,
  input: PagePersistInput
): Promise<string | null> {
  const { domainId, crawlResult, metadata, structuredData, links, socialProfiles } = input;
  const now = new Date().toISOString();

  // 1. Insert or update page record
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .insert({
      domain_id: domainId,
      url: crawlResult.url,
      title: metadata?.title || null,
      http_status: crawlResult.httpStatus,
      meta_description: metadata?.metaDescription || null,
      canonical_url: metadata?.canonicalUrl || null,
      language: metadata?.language || null,
      favicon_url: metadata?.faviconUrl || null,
      logo_url: metadata?.logoUrl || null,
      headings: (metadata?.headings as unknown as Json) || null,
      open_graph: (metadata?.openGraph as unknown as Json) || null,
      twitter_card: (metadata?.twitterCard as unknown as Json) || null,
      json_ld: (structuredData?.jsonLd as unknown as Json) || null,
      schema_org_types: structuredData?.schemaOrgTypes || null,
      social_links: (socialProfiles?.socialLinks as unknown as Json) || null,
      organization_details: (structuredData?.organizationDetails as unknown as Json) || null,
      images: (metadata?.images as unknown as Json) || null,
      robots_meta: metadata?.robotsMeta || null,
      word_count: crawlResult.wordCount,
      crawl_status: crawlResult.crawlStatus,
      crawl_error: crawlResult.crawlError || null,
      last_scanned_at: now,
    })
    .select('id')
    .single();

  if (pageError || !page) {
    return null;
  }

  // 2. Insert page_links edges
  if (links && links.length > 0) {
    const pageLinkRows = links.map((link) => ({
      source_page_id: page.id,
      target_url: link.targetUrl,
      link_type: link.linkType,
      anchor_text: link.anchorText,
    }));

    await supabase.from('page_links').insert(pageLinkRows);
  }

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
    updateData.result = resultPayload as Json;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  await supabase.from('jobs').update(updateData).eq('id', jobId);
}
