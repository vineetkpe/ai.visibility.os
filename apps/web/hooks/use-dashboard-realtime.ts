'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useDashboardRealtime(projectId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    // Subscribe to Realtime postgres_changes on ai_scans and jobs tables for current project
    const channel = supabase
      .channel(`project-dashboard-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_scans',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] AI scans table update detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboardOverview', projectId] });
          queryClient.invalidateQueries({ queryKey: ['scanHistory', projectId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] Jobs table update detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboardOverview', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
