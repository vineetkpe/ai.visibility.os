import * as cheerio from 'cheerio';
import { CRAWLER_USER_AGENT, FETCH_TIMEOUT_MS, type SitemapResult } from '../types';
import { validateUrl } from './validateUrl';

/**
 * Parses XML sitemap content to extract page URLs.
 */
export function extractSitemapUrls(xmlContent: string): string[] {
  const $ = cheerio.load(xmlContent, { xmlMode: true });
  const urls: string[] = [];

  $('url > loc').each((_, el) => {
    const loc = $(el).text().trim();
    if (loc && loc.startsWith('http')) {
      urls.push(loc);
    }
  });

  // Handle sitemap index files
  $('sitemap > loc').each((_, el) => {
    const loc = $(el).text().trim();
    if (loc && loc.startsWith('http')) {
      urls.push(loc);
    }
  });

  return Array.from(new Set(urls));
}

/**
 * Discovers and extracts sitemap URLs for a domain.
 */
export async function discoverSitemap(
  baseUrl: string,
  knownSitemaps: string[] = []
): Promise<SitemapResult> {
  const parsed = new URL(baseUrl);
  const candidateSitemaps = [...knownSitemaps, `${parsed.protocol}//${parsed.host}/sitemap.xml`];
  const uniqueSitemapTargets = Array.from(new Set(candidateSitemaps));

  const sitemapUrls: string[] = [];
  const pageUrls: string[] = [];

  for (const sitemapUrl of uniqueSitemapTargets) {
    const validation = await validateUrl(sitemapUrl);
    if (!validation.valid) continue;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(sitemapUrl, {
        headers: { 'User-Agent': CRAWLER_USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const xml = await res.text();
        sitemapUrls.push(sitemapUrl);
        const extracted = extractSitemapUrls(xml);
        pageUrls.push(...extracted);
      }
    } catch {
      // Continue checking next sitemap candidate on error
    }
  }

  return {
    sitemapUrls,
    pageUrls: Array.from(new Set(pageUrls)),
  };
}
