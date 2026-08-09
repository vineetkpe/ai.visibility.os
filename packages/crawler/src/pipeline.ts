import type { SupabaseClient, Database } from '@ai-visibility-os/database';
import {
  MAX_PAGES_PER_CRAWL,
  MAX_PLAYWRIGHT_PAGES,
  MIN_REQUEST_DELAY_MS,
  type CrawlPipelineOptions,
  type CrawlPipelineResult,
} from './types';
import { validateUrl } from './steps/validateUrl';
import { fetchRobotsTxt } from './steps/fetchRobotsTxt';
import { discoverSitemap } from './steps/discoverSitemap';
import { crawlPage } from './steps/crawlPage';
import { extractMetadata } from './steps/extractMetadata';
import { extractStructuredData } from './steps/extractStructuredData';
import { extractLinks } from './steps/extractLinks';
import { extractSocialProfiles } from './steps/extractSocialProfiles';
import { persistPageResult, updateJobStatus } from './steps/persistResults';

/**
 * Executes the complete Website Discovery Engine crawl pipeline for a target domain.
 */
export async function runDiscoveryPipeline(
  supabase: SupabaseClient<Database>,
  options: CrawlPipelineOptions
): Promise<CrawlPipelineResult> {
  const {
    domainId,
    domainName,
    jobId,
    maxPages = MAX_PAGES_PER_CRAWL,
    maxPlaywrightPages = MAX_PLAYWRIGHT_PAGES,
  } = options;

  let pagesCrawled = 0;
  let pagesFailed = 0;
  let playwrightCount = 0;

  try {
    // 1. Mark job as running
    await updateJobStatus(supabase, jobId, 'running');

    // 2. Validate base target URL
    const targetBaseUrl = domainName.startsWith('http') ? domainName : `https://${domainName}`;
    const baseValidation = await validateUrl(targetBaseUrl);

    if (!baseValidation.valid) {
      const errorMsg = baseValidation.error || 'Base URL validation failed.';
      await updateJobStatus(
        supabase,
        jobId,
        'failed',
        { pages_crawled: 0, pages_failed: 1 },
        errorMsg
      );
      return {
        jobId,
        domainId,
        status: 'failed',
        pagesCrawled: 0,
        pagesFailed: 1,
        error: errorMsg,
      };
    }

    const canonicalBaseUrl = baseValidation.url;

    // 3. Fetch robots.txt & discover sitemap
    const robots = await fetchRobotsTxt(canonicalBaseUrl);
    const sitemapResult = await discoverSitemap(canonicalBaseUrl, robots.sitemaps);

    // 4. Assemble candidate URLs queue & track robots skipped count
    let pagesSkippedRobots = 0;
    const queueSet = new Set<string>();
    if (robots.isAllowed(canonicalBaseUrl)) {
      queueSet.add(canonicalBaseUrl);
    } else {
      pagesSkippedRobots++;
    }

    for (const url of sitemapResult.pageUrls) {
      if (queueSet.size >= maxPages) break;
      if (robots.isAllowed(url)) {
        queueSet.add(url);
      } else {
        pagesSkippedRobots++;
      }
    }

    const targetUrls = Array.from(queueSet);

    // 5. Process pages in queue
    for (const pageUrl of targetUrls) {
      if (!robots.isAllowed(pageUrl)) {
        pagesSkippedRobots++;
        continue;
      }

      // Enforce host delay between requests
      await new Promise((r) => setTimeout(r, MIN_REQUEST_DELAY_MS));

      const canUsePlaywright = playwrightCount < maxPlaywrightPages;
      const crawlResult = await crawlPage(pageUrl, { canUsePlaywright });

      if (crawlResult.renderedVia === 'playwright') {
        playwrightCount++;
      }

      if (crawlResult.crawlStatus === 'failed') {
        pagesFailed++;
        await persistPageResult(supabase, {
          domainId,
          crawlResult,
          crawlSessionId: options.crawlSessionId || jobId,
        });
        continue;
      }

      // Extract literal metadata, structured data, links, social profiles
      const metadata = extractMetadata(crawlResult.html, crawlResult.url);
      const structuredData = extractStructuredData(crawlResult.html);
      const links = extractLinks(crawlResult.html, crawlResult.url, domainName);
      const socialProfiles = extractSocialProfiles(crawlResult.html);

      // Persist page and link edges to Supabase
      const pageId = await persistPageResult(supabase, {
        domainId,
        crawlResult,
        metadata,
        structuredData,
        links,
        socialProfiles,
        crawlSessionId: options.crawlSessionId || jobId,
      });

      if (pageId) {
        pagesCrawled++;
      } else {
        pagesFailed++;
      }

      // Update granular progress indicator on jobs table for live UI tracking
      if (jobId) {
        const completedCount = pagesCrawled + pagesFailed;
        await supabase
          .from('jobs')
          .update({
            progress: { completed: completedCount, total: targetUrls.length },
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }
    }

    const finalStatus = pagesCrawled > 0 ? 'completed' : 'failed';
    const finalError = finalStatus === 'failed' ? 'Failed to crawl any target pages.' : undefined;

    await updateJobStatus(
      supabase,
      jobId,
      finalStatus,
      {
        pages_crawled: pagesCrawled,
        pages_failed: pagesFailed,
        sitemap_url: sitemapResult.sitemapUrls[0] || null,
        sitemap_urls_found: sitemapResult.pageUrls.length,
        pages_skipped_robots: pagesSkippedRobots,
      },
      finalError
    );

    return {
      jobId,
      domainId,
      status: finalStatus,
      pagesCrawled,
      pagesFailed,
      error: finalError,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Pipeline execution encountered an unexpected error.';
    await updateJobStatus(
      supabase,
      jobId,
      'failed',
      { pages_crawled: pagesCrawled, pages_failed: pagesFailed },
      errorMsg
    );
    return {
      jobId,
      domainId,
      status: 'failed',
      pagesCrawled,
      pagesFailed,
      error: errorMsg,
    };
  }
}
