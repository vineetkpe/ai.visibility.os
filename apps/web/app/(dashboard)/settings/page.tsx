import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { SettingsClientView } from './settings-client-view';

export const metadata = {
  title: 'Project Settings | AI Visibility OS',
  description: 'Manage project metadata, domain links, and danger zone actions.',
};

interface PageProps {
  searchParams: Promise<{ projectId?: string; project_id?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fsettings');
  }

  const params = await searchParams;
  const requestedProjectId = params?.projectId || params?.project_id;

  // Fetch user's requested active project or default to latest active project
  let query = supabase
    .from('projects')
    .select('id, name, created_at, domains(host, is_primary)')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (requestedProjectId) {
    query = query.eq('id', requestedProjectId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data: project } = await query.maybeSingle();

  if (!project) {
    redirect('/onboarding');
  }

  const primaryDomainObj = project.domains?.find((d) => d.is_primary) || project.domains?.[0];

  const projectData = {
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    primaryDomain: primaryDomainObj?.host || null,
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
