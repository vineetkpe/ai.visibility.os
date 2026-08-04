import robotsParser from 'robots-parser';
import { CRAWLER_USER_AGENT, FETCH_TIMEOUT_MS, type RobotsTxtResult } from '../types';
import { validateUrl } from './validateUrl';

/**
 * Fetches and parses robots.txt for a target base URL, returning permission checking helper.
 */
export async function fetchRobotsTxt(baseUrl: string): Promise<RobotsTxtResult> {
  const parsed = new URL(baseUrl);
  const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

  // SSRF Check for robots.txt URL
  const validation = await validateUrl(robotsUrl);
  if (!validation.valid) {
    return {
      url: robotsUrl,
      content: null,
      sitemaps: [],
      isAllowed: () => true, // Default to allowed if robots.txt URL is invalid
    };
  }

  let content: string | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': CRAWLER_USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      content = await response.text();
    }
  } catch {
    content = null;
  }

  const robot = robotsParser(robotsUrl, content ?? '');
  const sitemaps = robot.getSitemaps();

  return {
    url: robotsUrl,
    content,
    sitemaps,
    isAllowed: (targetUrl: string) => {
      if (!content) return true;
      const allowed = robot.isAllowed(targetUrl, CRAWLER_USER_AGENT);
      return allowed !== false;
    },
  };
}
