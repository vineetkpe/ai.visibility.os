import * as cheerio from 'cheerio';
import type { ExtractedLink } from '../types';

/**
 * Extracts internal and external hyperlink edges from a web page HTML document.
 */
export function extractLinks(
  html: string,
  currentUrl: string,
  baseDomain: string
): ExtractedLink[] {
  const $ = cheerio.load(html);
  const currentUrlObj = new URL(currentUrl);
  const linksMap = new Map<string, ExtractedLink>();

  const normalizedBaseDomain = baseDomain.toLowerCase().replace(/^www\./, '');

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    const anchorText = $(el).text().replace(/\s+/g, ' ').trim() || null;

    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }

    try {
      const targetUrlObj = new URL(href, currentUrlObj);
      // Remove hash fragment
      targetUrlObj.hash = '';
      const targetUrl = targetUrlObj.toString();

      const targetHost = targetUrlObj.hostname.toLowerCase().replace(/^www\./, '');
      const linkType: 'internal' | 'external' =
        targetHost === normalizedBaseDomain || targetHost.endsWith(`.${normalizedBaseDomain}`)
          ? 'internal'
          : 'external';

      if (!linksMap.has(targetUrl)) {
        linksMap.set(targetUrl, {
          targetUrl,
          linkType,
          anchorText,
        });
      }
    } catch {
      // Ignore invalid URL links
    }
  });

  return Array.from(linksMap.values());
}
