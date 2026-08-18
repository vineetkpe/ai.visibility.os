import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export interface DashboardLayoutProps { children: ReactNode; }

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  let activeProject: { id: string; name: string } | null = null;

  if (user) {
    const [{ data: profile }, { data: project }] = await Promise.all([
      supabase.from('users').select('display_name, avatar_url, role').eq('id', user.id).maybeSingle(),
      supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profile?.display_name) displayName = profile.display_name;
    else if (user.email) displayName = user.email.split('@')[0] ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    activeProject = project ?? null;
  }

  return (
    <DashboardShell
      displayName={displayName}
      avatarUrl={avatarUrl}
      isAdmin={isAdmin}
      activeProject={activeProject}
    >
      {children}
    </DashboardShell>
  );
}
