import { createClient } from '@/lib/supabase/server';
import { getReportsData } from './actions';
import { ReportsClientView } from './reports-client-view';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(1);
  const projectId = projects?.[0]?.id;
  if (!projectId) return <div className="p-8 text-sm text-slate-600">Create a project before generating reports.</div>;

  const result = await getReportsData(projectId);
  return <ReportsClientView projectId={projectId} initialReports={result.data?.reports || []} initialError={result.error} />;
}
