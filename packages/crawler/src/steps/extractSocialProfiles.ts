import * as cheerio from 'cheerio';
import type { SocialProfilesResult } from '../types';

const SOCIAL_PLATFORMS = [
  { name: 'twitter', match: /(twitter\.com|x\.com)/i },
  { name: 'linkedin', match: /linkedin\.com/i },
  { name: 'github', match: /github\.com/i },
  { name: 'facebook', match: /facebook\.com/i },
  { name: 'instagram', match: /instagram\.com/i },
  { name: 'youtube', match: /youtube\.com/i },
];

/**
 * Extracts social profile link URLs found on the web page.
 */
export function extractSocialProfiles(html: string): SocialProfilesResult {
  const $ = cheerio.load(html);
  const socialLinks: Record<string, string> = {};

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href) return;

    for (const platform of SOCIAL_PLATFORMS) {
      if (!socialLinks[platform.name] && platform.match.test(href)) {
        socialLinks[platform.name] = href;
      }
    }
  });

  return { socialLinks };
}
