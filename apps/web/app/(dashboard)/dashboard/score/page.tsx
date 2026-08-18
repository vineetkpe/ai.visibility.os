import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { ScoreClientView } from './score-client-view';

export const metadata = {
  title: 'AI Visibility Score Analytics | AI Visibility OS',
  description: 'Real AI visibility score calculations derived from persisted scans and citations.',
};

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect('/login?redirect=%2Fdashboard%2Fscore');

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) redirect('/onboarding');

  return (
    <PageContainer title="" description="">
      <ScoreClientView projectId={project.id} />
    </PageContainer>
  );
}
