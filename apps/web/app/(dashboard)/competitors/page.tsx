import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import Link from 'next/link';
import { CompetitorsClientView } from './competitors-client-view';
import {
  getCompetitorsOverviewAction,
  getSuggestionsAction,
} from './actions';

interface PageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function CompetitorsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Fcompetitors');
  }

  // Fetch active projects for authenticated user
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (!projects || projects.length === 0) {
    return (
      <PageContainer
        title="Competitor Intelligence Engine"
        description="Benchmark user-confirmed competitors against AI scan citations and website discovery data."
      >
        <EmptyState
          icon={<FolderPlus className="h-7 w-7 text-slate-400" />}
          title="No active projects found"
          description="Create your first website project to begin tracking competitor visibility and benchmark analysis."
          action={
            <Button asChild variant="outline">
              <Link href="/onboarding">Get Started with Onboarding</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const resolvedSearchParams = await searchParams;
  const currentProjectId = resolvedSearchParams.projectId || projects[0]?.id || '';

  const competitorsRes = await getCompetitorsOverviewAction(currentProjectId);
  const suggestionsRes = await getSuggestionsAction(currentProjectId);

  const competitors = competitorsRes.success ? competitorsRes.data || [] : [];
  const suggestions = suggestionsRes.success ? suggestionsRes.data || [] : [];

  return (
    <PageContainer
      title="Competitor Intelligence Engine"
      description="Track user-confirmed competitors, match AI model scan citations, and compare real website content."
    >
      <CompetitorsClientView
        projects={projects}
        currentProjectId={currentProjectId}
        initialCompetitors={competitors}
        initialSuggestions={suggestions}
      />
    </PageContainer>
  );
}
