import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { ScoreClientView } from './score-client-view';

export const metadata = {
  title: 'AI Visibility Score Analytics | AI Visibility OS',
  description: 'Mathematical breakdown and attribution weight analysis for composite visibility scores.',
};

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <PageContainer title="" description="">
      <ScoreClientView projectId={user.id} />
    </PageContainer>
  );
}
