'use server';

import { createClient } from '@/lib/supabase/server';
import { visibilityScanTask } from '@ai-visibility-os/jobs';

export interface VisibilityScanActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to manually initiate AI Visibility Engine scanning for a project.
 * Verification requirement: Scoped via auth.uid() and requires an active business context version (is_current = true).
 */
export async function startVisibilityScanAction(projectId: string): Promise<VisibilityScanActionResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    // 2. Verify project ownership scoped via auth.uid()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    // 3. Gate check: Verify project has a current business context version (is_current = true)
    const { data: currentVersions, error: versionCheckError } = await supabase
      .from('business_context_versions')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_current', true)
      .limit(1);

    if (versionCheckError) {
      return { success: false, error: versionCheckError.message };
    }

    if (!currentVersions || currentVersions.length === 0) {
      return {
        success: false,
        error: 'Scan generation requires a current business context. Please generate business context first.',
      };
    }

    // 4. Dispatch Trigger.dev task on background infrastructure
    try {
      await visibilityScanTask.trigger({
        projectId: project.id,
      });
    } catch (triggerErr: unknown) {
      console.warn('Trigger.dev visibility scan task dispatch warning:', triggerErr);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
