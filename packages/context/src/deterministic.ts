import type { ExtractedField, PageRecord } from './types';

/**
 * Executes deterministic extraction pass on crawled pages data.
 * Extracts companyName, contactInformation, socialProfiles, locations, languages, technologies, and structured FAQ schema.
 */
export function extractDeterministicFields(pages: PageRecord[]): ExtractedField[] {
  const fields: ExtractedField[] = [];

  if (!pages || pages.length === 0) return fields;

  const primaryPage = pages[0] as PageRecord;

  // 1. Company Name
  let foundCompanyName = false;
  for (const page of pages) {
    if (page.organization_details && typeof page.organization_details.name === 'string') {
      const name = page.organization_details.name.trim();
      if (name) {
        fields.push({
          fieldName: 'companyName',
          fieldValue: name,
          confidenceScore: 0.95,
          sourcePageId: page.id,
          extractionMethod: 'deterministic',
        });
        foundCompanyName = true;
        break;
      }
    }
  }

  if (!foundCompanyName && primaryPage) {
    if (primaryPage.title) {
      // Extract brand title portion before pipe or dash if available
      const rawTitle = primaryPage.title.split(/[|–—]/)[0]?.trim() || primaryPage.title.trim();
      if (rawTitle) {
        fields.push({
          fieldName: 'companyName',
          fieldValue: rawTitle,
          confidenceScore: 0.7,
          sourcePageId: primaryPage.id,
          extractionMethod: 'deterministic',
        });
      }
    }
  }

  // 2. Languages
  const languagesSet = new Set<string>();
  pages.forEach((p) => {
    if (p.language) {
      languagesSet.add(p.language.trim().toLowerCase());
    }
  });

  languagesSet.forEach((lang) => {
    fields.push({
      fieldName: 'languages',
      fieldValue: lang,
      confidenceScore: 0.85,
      sourcePageId: primaryPage?.id || null,
      extractionMethod: 'deterministic',
    });
  });

  // 3. Social Profiles & Contact Info
  const socialSet = new Map<string, { value: string; pageId: string }>();

  for (const page of pages) {
    if (page.social_links && typeof page.social_links === 'object') {
      Object.entries(page.social_links).forEach(([platform, url]) => {
        if (typeof url === 'string' && url.trim()) {
          const key = `${platform}:${url.trim()}`;
          if (!socialSet.has(key)) {
            socialSet.set(key, { value: `${platform}: ${url.trim()}`, pageId: page.id });
          }
        }
      });
    }

    // Contact info from Organization details
    if (page.organization_details) {
      const org = page.organization_details;
      if (typeof org.email === 'string' && org.email.trim()) {
        fields.push({
          fieldName: 'contactInformation',
          fieldValue: `Email: ${org.email.trim()}`,
          confidenceScore: 0.9,
          sourcePageId: page.id,
          extractionMethod: 'deterministic',
        });
      }
      if (typeof org.telephone === 'string' && org.telephone.trim()) {
        fields.push({
          fieldName: 'contactInformation',
          fieldValue: `Phone: ${org.telephone.trim()}`,
          confidenceScore: 0.9,
          sourcePageId: page.id,
          extractionMethod: 'deterministic',
        });
      }
      if (org.address && typeof org.address === 'object') {
        const addrObj = org.address as Record<string, unknown>;
        const locality = addrObj.addressLocality || addrObj.addressRegion;
        const country = addrObj.addressCountry;
        if (country && typeof country === 'string') {
          fields.push({
            fieldName: 'locations',
            fieldValue: country.trim(),
            confidenceScore: 0.9,
            sourcePageId: page.id,
            extractionMethod: 'deterministic',
          });
        }
        if (locality && typeof locality === 'string') {
          fields.push({
            fieldName: 'locations',
            fieldValue: locality.trim(),
            confidenceScore: 0.85,
            sourcePageId: page.id,
            extractionMethod: 'deterministic',
          });
        }
      }
    }

    // Structured FAQ Schema check
    if (page.json_ld && Array.isArray(page.json_ld)) {
      for (const block of page.json_ld) {
        if (
          block &&
          typeof block === 'object' &&
          block['@type'] === 'FAQPage' &&
          Array.isArray(block.mainEntity)
        ) {
          for (const item of block.mainEntity) {
            if (item && typeof item === 'object' && item.name && item.acceptedAnswer?.text) {
              const q = String(item.name).trim();
              const a = String(item.acceptedAnswer.text).trim();
              fields.push({
                fieldName: 'faq',
                fieldValue: `Q: ${q} | A: ${a}`,
                confidenceScore: 0.95,
                sourcePageId: page.id,
                extractionMethod: 'deterministic',
              });
            }
          }
        }
      }
    }
  }

  socialSet.forEach((item) => {
    fields.push({
      fieldName: 'socialProfiles',
      fieldValue: item.value,
      confidenceScore: 0.9,
      sourcePageId: item.pageId,
      extractionMethod: 'deterministic',
    });
  });

  return fields;
}
