import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getReportsData } from './actions';
import { ReportsClientView } from './reports-client-view';

interface ReportsPageProps {
  searchParams: Promise<{ projectId?: string; project_id?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=%2Freports');

  const params = await searchParams;
  const requestedProjectId = params.projectId || params.project_id;
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
  if (!project) redirect('/onboarding');

  const result = await getReportsData(project.id);
  return (
    <ReportsClientView
      projectId={project.id}
      initialReports={result.data?.reports || []}
      initialError={result.error}
    />
  );
}
