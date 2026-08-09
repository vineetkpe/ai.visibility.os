import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjectRecommendations } from '@ai-visibility-os/recommendations';
import { RecommendationsClientView } from './recommendations-client-view';

export const metadata = {
  title: 'AI Recommendations | AI Visibility OS',
  description: 'Evidence-grounded AI search optimization recommendations.',
};

interface PageProps {
  searchParams: Promise<{ projectId?: string; project_id?: string }>;
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
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
    redirect('/projects/new');
  }

  const initialRecommendations = await getProjectRecommendations(supabase, project.id);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <RecommendationsClientView
        projectId={project.id}
        initialRecommendations={initialRecommendations}
      />
    </div>
  );
}
