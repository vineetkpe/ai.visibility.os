import * as cheerio from 'cheerio';
import { CRAWLER_USER_AGENT, FETCH_TIMEOUT_MS, type PageCrawlResult } from '../types';
import { validateUrl } from './validateUrl';

export interface CrawlPageOptions {
  allowPlaywrightFallback?: boolean;
  canUsePlaywright?: boolean;
}

/**
 * Computes visible word count and text-to-markup ratio for Cheerio document.
 */
export function computeTextMetrics(html: string): { wordCount: number; ratio: number } {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const ratio = html.length > 0 ? text.length / html.length : 0;
  return { wordCount: words, ratio };
}

/**
 * Performs HTTP fetch with redirect hop SSRF re-validation and max 5 redirect limit.
 */
export async function fetchWithSsrfProtection(
  urlStr: string,
  maxRedirects = 5
): Promise<{ ok: boolean; status: number | null; html: string; finalUrl: string; error?: string }> {
  let currentUrl = urlStr;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const validation = await validateUrl(currentUrl);
    if (!validation.valid) {
      return {
        ok: false,
        status: null,
        html: '',
        finalUrl: currentUrl,
        error: validation.error || 'SSRF check failed.',
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(currentUrl, {
        headers: { 'User-Agent': CRAWLER_USER_AGENT },
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Handle 429 / 503 Retry-After header once
      if (res.status === 429 || res.status === 503) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const delaySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 1 : 1;
        const boundedDelay = Math.min(delaySeconds, 3) * 1000;
        await new Promise((r) => setTimeout(r, boundedDelay));
      }

      // Handle Redirects with SSRF Re-Validation
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('Location');
        if (!location || !location.trim()) {
          return {
            ok: false,
            status: res.status,
            html: '',
            finalUrl: currentUrl,
            error: `HTTP ${res.status} redirect missing valid Location header.`,
          };
        }

        let nextUrlObj: URL;
        try {
          nextUrlObj = new URL(location.trim(), currentUrl);
        } catch {
          return {
            ok: false,
            status: res.status,
            html: '',
            finalUrl: currentUrl,
            error: `Invalid redirect Location header format: '${location}'.`,
          };
        }

        const nextUrlStr = nextUrlObj.toString();

        // Immediate SSRF re-validation on redirect destination before next hop
        const redirectValidation = await validateUrl(nextUrlStr);
        if (!redirectValidation.valid) {
          return {
            ok: false,
            status: res.status,
            html: '',
            finalUrl: nextUrlStr,
            error: `SSRF Protection: Redirect to '${nextUrlStr}' rejected. ${redirectValidation.error || 'Private/reserved IP address.'}`,
          };
        }

        currentUrl = nextUrlStr;
        redirectCount++;
        continue;
      }

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          html: '',
          finalUrl: currentUrl,
          error: `HTTP error ${res.status}: ${res.statusText}`,
        };
      }

      const html = await res.text();
      return {
        ok: true,
        status: res.status,
        html,
        finalUrl: currentUrl,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch request failed.';
      return { ok: false, status: null, html: '', finalUrl: currentUrl, error: msg };
    }
  }

  return {
    ok: false,
    status: null,
    html: '',
    finalUrl: currentUrl,
    error: 'Exceeded maximum redirect count (5).',
  };
}

/**
 * Crawls a single web page via HTTP/Cheerio, with Playwright fallback for JS-rendered pages.
 */
export async function crawlPage(
  urlStr: string,
  options: CrawlPageOptions = {}
): Promise<PageCrawlResult> {
  const fetchRes = await fetchWithSsrfProtection(urlStr);

  if (!fetchRes.ok) {
    return {
      url: urlStr,
      httpStatus: fetchRes.status,
      html: '',
      renderedVia: 'cheerio',
      textToMarkupRatio: 0,
      wordCount: 0,
      crawlStatus: 'failed',
      crawlError: fetchRes.error,
    };
  }

  const { wordCount, ratio } = computeTextMetrics(fetchRes.html);

  // If text-to-markup ratio is extremely low or word count < 20, check if Playwright fallback is allowed
  const isJsRendered = ratio < 0.03 || wordCount < 20;

  if (isJsRendered && options.canUsePlaywright) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ userAgent: CRAWLER_USER_AGENT });
      const page = await context.newPage();

      await page.goto(fetchRes.finalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: FETCH_TIMEOUT_MS,
      });
      const renderedHtml = await page.content();
      await browser.close();

      const pwMetrics = computeTextMetrics(renderedHtml);

      return {
        url: fetchRes.finalUrl,
        httpStatus: fetchRes.status,
        html: renderedHtml,
        renderedVia: 'playwright',
        textToMarkupRatio: pwMetrics.ratio,
        wordCount: pwMetrics.wordCount,
        crawlStatus: 'completed',
      };
    } catch {
      // Return Cheerio result if Playwright fallback fails
    }
  }

  return {
    url: fetchRes.finalUrl,
    httpStatus: fetchRes.status,
    html: fetchRes.html,
    renderedVia: 'cheerio',
    textToMarkupRatio: ratio,
    wordCount,
    crawlStatus: 'completed',
  };
}
