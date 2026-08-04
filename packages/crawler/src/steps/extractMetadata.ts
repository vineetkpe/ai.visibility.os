import * as cheerio from 'cheerio';
import type { PageMetadata } from '../types';

/**
 * Extracts literal HTML metadata, headings, images, OpenGraph, Twitter Cards, and favicon/logo URLs.
 */
export function extractMetadata(html: string, currentUrl: string): PageMetadata {
  const $ = cheerio.load(html);
  const baseUrl = new URL(currentUrl);

  const resolveUrl = (path?: string | null): string | null => {
    if (!path) return null;
    try {
      return new URL(path, baseUrl).toString();
    } catch {
      return null;
    }
  };

  // Title & Descriptions
  const title = $('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description" i]').attr('content')?.trim() || null;
  const canonicalUrl = resolveUrl($('link[rel="canonical"]').attr('href')?.trim());
  const language = $('html').attr('lang')?.trim() || null;
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || null;

  // Favicon & Logo
  const faviconPath =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href');
  const faviconUrl = resolveUrl(faviconPath) || `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`;

  let logoUrl: string | null = null;
  const logoImg = $('img[src*="logo" i], img[alt*="logo" i], .logo img, header img').first();
  if (logoImg.length > 0) {
    logoUrl = resolveUrl(logoImg.attr('src'));
  }

  // Headings (H1 - H6)
  const headings: Record<string, string[]> = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
  };

  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    $(tag).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) {
        headings[tag]!.push(text);
      }
    });
  });

  // Images & Alt Text
  const images: Array<{ src: string; alt?: string }> = [];
  $('img[src]').each((_, el) => {
    const src = resolveUrl($(el).attr('src'));
    const alt = $(el).attr('alt')?.trim();
    if (src) {
      images.push({ src, alt: alt || undefined });
    }
  });

  // Open Graph meta tags
  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')?.toLowerCase();
    const content = $(el).attr('content')?.trim();
    if (prop && content) {
      openGraph[prop] = content;
    }
  });

  // Twitter Card meta tags
  const twitterCard: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name')?.toLowerCase();
    const content = $(el).attr('content')?.trim();
    if (name && content) {
      twitterCard[name] = content;
    }
  });

  // Fallback logo from OpenGraph
  if (!logoUrl && openGraph['og:image']) {
    logoUrl = resolveUrl(openGraph['og:image']);
  }

  return {
    title,
    metaDescription,
    canonicalUrl,
    language,
    faviconUrl,
    logoUrl,
    robotsMeta,
    headings,
    images: images.slice(0, 50), // Cap image list to first 50
    openGraph,
    twitterCard,
  };
}
