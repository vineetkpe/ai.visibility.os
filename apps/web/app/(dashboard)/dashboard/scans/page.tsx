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

export default async function ScansHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fdashboard%2Fscans');
  }

  // Fetch primary active project
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
