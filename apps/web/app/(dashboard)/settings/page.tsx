import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { SettingsClientView } from './settings-client-view';

export const metadata = {
  title: 'Project Settings | AI Visibility OS',
  description: 'Manage project metadata, domain links, and danger zone actions.',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fsettings');
  }

  // Fetch user's primary active project with deleted_at filter
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, created_at, domains(domain_name, is_primary)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    redirect('/onboarding');
  }

  const primaryDomainObj =
    project.domains?.find((d) => d.is_primary) || project.domains?.[0];

  const projectData = {
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    primaryDomain: primaryDomainObj?.domain_name || null,
  };

  return (
    <PageContainer
      title="Project Settings"
      description="Manage workspace preferences, project details, and administrative controls."
    >
      <SettingsClientView project={projectData} />
    </PageContainer>
  );
}
