import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { EnginesClientView } from './engines-client-view';

export const metadata = {
  title: 'AI Search Engine Registry | AI Visibility OS',
  description: 'Track generative search engines, scan cadences, citation depths, and retrieval behaviors.',
};

export default async function EnginesPage() {
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
      <EnginesClientView projectId={user.id} />
    </PageContainer>
  );
}
