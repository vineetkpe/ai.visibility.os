import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getDashboardOverviewData } from './actions';
import { DashboardClientView } from './dashboard-client-view';

export const metadata = { title: 'Dashboard | AI Visibility OS', description: 'AI visibility intelligence, trends, evidence, and prioritized actions.' };

interface PageProps { searchParams: Promise<{ projectId?: string; project_id?: string }>; }

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login?redirect=%2Fdashboard');

  const params = await searchParams;
  const requestedProjectId = params.projectId || params.project_id;
  let query = supabase.from('projects').select('id').eq('user_id', user.id).is('deleted_at', null);
  if (requestedProjectId) query = query.eq('id', requestedProjectId); else query = query.order('created_at', { ascending: false }).limit(1);
  const { data: project } = await query.maybeSingle();
  if (!project) redirect('/onboarding');

  const overviewResult = await getDashboardOverviewData(project.id);
  return <PageContainer title="" description=""><DashboardClientView projectId={project.id} initialData={overviewResult.success ? overviewResult.data : undefined} /></PageContainer>;
}
