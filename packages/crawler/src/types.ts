export const MAX_PAGES_PER_CRAWL = 40;
export const MAX_PLAYWRIGHT_PAGES = 5;
export const FETCH_TIMEOUT_MS = 10000;
export const MAX_CONCURRENCY = 4;
export const MIN_REQUEST_DELAY_MS = 500;
export const PIPELINE_TIMEOUT_MS = 300000;
export const CRAWLER_USER_AGENT = 'AIVisibilityOSBot/1.0 (+https://aivisibility.os)';

export interface ValidateUrlResult {
  valid: boolean;
  url: string;
  resolvedIp?: string;
  error?: string;
}

export interface RobotsTxtResult {
  url: string;
  content: string | null;
  sitemaps: string[];
  isAllowed: (targetUrl: string) => boolean;
}

export interface SitemapResult {
  sitemapUrls: string[];
  pageUrls: string[];
}

export interface PageCrawlResult {
  url: string;
  httpStatus: number | null;
  html: string;
  renderedVia: 'cheerio' | 'playwright';
  textToMarkupRatio: number;
  wordCount: number;
  crawlStatus: 'completed' | 'failed';
  crawlError?: string;
}

export interface PageMetadata {
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  language: string | null;
  faviconUrl: string | null;
  logoUrl: string | null;
  robotsMeta: string | null;
  headings: Record<string, string[]>;
  images: Array<{ src: string; alt?: string }>;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
}

export interface StructuredDataResult {
  jsonLd: Record<string, unknown>[];
  schemaOrgTypes: string[];
  organizationDetails: Record<string, unknown> | null;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  } | null;
}

export interface ExtractedLink {
  targetUrl: string;
  linkType: 'internal' | 'external';
  anchorText: string | null;
}

export interface SocialProfilesResult {
  socialLinks: Record<string, string>;
}

export interface CrawlPipelineOptions {
  domainId: string;
  domainName: string;
  jobId: string;
  crawlSessionId?: string;
  maxPages?: number;
  maxPlaywrightPages?: number;
}

export interface CrawlPipelineResult {
  jobId: string;
  domainId: string;
  status: 'completed' | 'failed';
  pagesCrawled: number;
  pagesFailed: number;
  error?: string;
}
