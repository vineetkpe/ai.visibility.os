import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getScanHistoryData } from '../actions';
import { ScansClientView } from './scans-client-view';

export const metadata = {
  title: 'AI Scan History | AI Visibility OS',
  description: 'Track prompt execution history across AI search engine providers.',
};

interface PageProps {
  searchParams: Promise<{ projectId?: string; project_id?: string }>;
}

export default async function ScansHistoryPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fdashboard%2Fscans');
  }

  const params = await searchParams;
  const requestedProjectId = params?.projectId || params?.project_id;

  // Fetch requested project or default to latest active project
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

  const scansResult = await getScanHistoryData(project.id);
  const initialScans = scansResult.success && scansResult.data ? scansResult.data.scans : [];

  return (
    <PageContainer
      title="AI Scan History"
      description="Historical log of AI search engine prompt evaluations and visibility scores."
    >
      <ScansClientView projectId={project.id} initialScans={initialScans} />
    </PageContainer>
  );
}
