'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createProjectSchema,
  updateProjectSchema,
  extractDomainName,
  type CreateProjectInput,
} from '@ai-visibility-os/shared';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new project and link its primary domain.
 */
export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult<{ projectId: string }>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Validate input schema with Zod
    const parseResult = createProjectSchema.safeParse(input);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid input data.';
      return { success: false, error: firstError };
    }

    const { name, websiteUrl } = parseResult.data;

    // 3. Extract and normalize hostname
    const domainName = extractDomainName(websiteUrl);

    // 4. Duplicate Domain Check across user's active projects
    const { data: userProjects, error: fetchProjectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (fetchProjectsError) {
      return { success: false, error: fetchProjectsError.message };
    }

    if (userProjects && userProjects.length > 0) {
      const projectIds = userProjects.map((p) => p.id);
      const { data: existingDomains, error: domainCheckError } = await supabase
        .from('domains')
        .select('id')
        .in('project_id', projectIds)
        .eq('host', domainName)
        .is('deleted_at', null);

      if (domainCheckError) {
        return { success: false, error: domainCheckError.message };
      }

      if (existingDomains && existingDomains.length > 0) {
        return {
          success: false,
          error: `You have already added the domain "${domainName}" to one of your projects.`,
        };
      }
    }

    // 5. Create project and primary domain atomically via RPC
    const { data: projectId, error: rpcError } = await supabase.rpc('create_project_with_domain', {
      p_name: name.trim(),
      p_host: domainName,
    });

    if (rpcError || !projectId) {
      return {
        success: false,
        error: rpcError?.message || 'Failed to create project and primary domain.',
      };
    }

    // Automatically trigger initial website discovery crawl for the newly created domain
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (domain) {
      const { startSiteCrawlAction } = await import('./crawl-actions');
      await startSiteCrawlAction(domain.id);
    }

    return {
      success: true,
      data: { projectId },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Server action to soft-delete a project by setting deleted_at timestamp.
 * Verification requirement: Scoped via auth.uid() and project user_id.
 */
export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult<{ projectId: string }>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Verify project ownership scoped via auth.uid()
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !project) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    // 3. Soft-delete project by setting deleted_at timestamp
    const { error: updateError } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message || 'Failed to delete project.' };
    }

    return {
      success: true,
      data: { projectId },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Server action to update project name.
 * Verification requirement: Scoped via auth.uid() and project user_id.
 * Validates name using Zod schema updateProjectSchema.
 */
export async function updateProjectAction(
  projectId: string,
  name: string
): Promise<ActionResult<{ projectId: string; name: string }>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Validate input schema with Zod
    const parseResult = updateProjectSchema.safeParse({ projectId, name });
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid project data.';
      return { success: false, error: firstError };
    }

    const cleanName = parseResult.data.name;

    // 3. Verify project ownership scoped via auth.uid()
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !project) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    // 4. Update project name and updated_at timestamp
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message || 'Failed to update project name.' };
    }

    return {
      success: true,
      data: { projectId, name: cleanName },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
