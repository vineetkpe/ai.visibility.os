import * as cheerio from 'cheerio';
import type { StructuredDataResult } from '../types';

/**
 * Parses JSON-LD scripts and literal contact info/organization schema from HTML.
 */
export function extractStructuredData(html: string): StructuredDataResult {
  const $ = cheerio.load(html);
  const jsonLdBlocks: Record<string, unknown>[] = [];
  const schemaTypesSet = new Set<string>();

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawText = $(el).html()?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === 'object') {
              jsonLdBlocks.push(item);
              if (item['@type']) {
                if (Array.isArray(item['@type'])) {
                  item['@type'].forEach((t: string) => schemaTypesSet.add(String(t)));
                } else {
                  schemaTypesSet.add(String(item['@type']));
                }
              }
            }
          });
        } else if (parsed && typeof parsed === 'object') {
          jsonLdBlocks.push(parsed);
          if (parsed['@type']) {
            if (Array.isArray(parsed['@type'])) {
              parsed['@type'].forEach((t: string) => schemaTypesSet.add(String(t)));
            } else {
              schemaTypesSet.add(String(parsed['@type']));
            }
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  });

  // Extract Organization Schema if present
  let organizationDetails: Record<string, unknown> | null = null;
  for (const block of jsonLdBlocks) {
    const type = block['@type'];
    if (type === 'Organization' || (Array.isArray(type) && type.includes('Organization'))) {
      organizationDetails = block;
      break;
    }
  }

  // Extract literal contact info (email, phone, address) from JSON-LD or footer text
  let email: string | undefined;
  let phone: string | undefined;
  let address: string | undefined;

  // 1. From JSON-LD
  if (organizationDetails) {
    if (typeof organizationDetails.email === 'string') email = organizationDetails.email;
    if (typeof organizationDetails.telephone === 'string') phone = organizationDetails.telephone;
  }

  // 2. Fallback regex search on footer / body text for literal mailto: or tel: links
  if (!email) {
    const mailto = $('a[href^="mailto:"]').first().attr('href');
    if (mailto) {
      email = mailto.replace('mailto:', '').split('?')[0]?.trim();
    }
  }

  if (!phone) {
    const tel = $('a[href^="tel:"]').first().attr('href');
    if (tel) {
      phone = tel.replace('tel:', '').trim();
    }
  }

  const contactInfo = email || phone || address ? { email, phone, address } : null;

  return {
    jsonLd: jsonLdBlocks,
    schemaOrgTypes: Array.from(schemaTypesSet),
    organizationDetails,
    contactInfo,
  };
}
