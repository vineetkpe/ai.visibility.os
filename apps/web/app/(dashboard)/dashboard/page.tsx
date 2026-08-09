import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getDashboardOverviewData } from './actions';
import { DashboardClientView } from './dashboard-client-view';

export const metadata = {
  title: 'Dashboard | AI Visibility OS',
  description:
    'Real-time AI search engine visibility, competitor benchmarks, and optimization analytics.',
};

interface PageProps {
  searchParams: Promise<{ projectId?: string; project_id?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fdashboard');
  }

  const params = await searchParams;
  const requestedProjectId = params.projectId || params.project_id;

  // Fetch user's target project or default to latest active project
  let query = supabase
    .from('projects')
    .select('id')
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

  // Fetch initial dashboard overview data server-side
  const overviewResult = await getDashboardOverviewData(project.id);
  const initialData = overviewResult.success ? overviewResult.data : undefined;

  return (
    <PageContainer
      title="Dashboard & Analytics"
      description="Real-time performance analytics, AI visibility trends, and grounded optimization task metrics."
    >
      <DashboardClientView projectId={project.id} initialData={initialData} />
    </PageContainer>
  );
}
