import { z } from 'zod';

/**
 * Extracts and normalizes the lowercase hostname from a valid HTTPS URL string.
 * Strips path, query params, hash, and trailing slashes.
 */
export function extractDomainName(inputUrl: string): string {
  const url = new URL(inputUrl);
  return url.hostname.toLowerCase();
}

/**
 * Shared Zod validation schema for project and primary domain creation.
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(255, 'Project name cannot exceed 255 characters'),
  websiteUrl: z
    .string()
    .trim()
    .min(1, 'Website URL is required')
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          return url.protocol === 'https:' && Boolean(url.hostname);
        } catch {
          return false;
        }
      },
      { message: 'Website must be a valid HTTPS URL (e.g., https://example.com)' }
    ),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Shared Zod validation schema for updating project name.
 */
export const updateProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(255, 'Project name cannot exceed 255 characters'),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
