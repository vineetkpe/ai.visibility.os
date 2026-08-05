import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getDashboardOverviewData } from './actions';
import { DashboardClientView } from './dashboard-client-view';

export const metadata = {
  title: 'Dashboard | AI Visibility OS',
  description: 'Real-time AI search engine visibility, competitor benchmarks, and optimization analytics.',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fdashboard');
  }

  // Fetch user's primary active project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

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
