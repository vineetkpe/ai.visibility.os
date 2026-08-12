import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { ProvidersClientView } from './providers-client-view';

export default async function AdminProvidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fadmin%2Fproviders');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'owner'].includes(profile.role)) redirect('/dashboard');

  const db = supabase as any;
  const { data: providers } = await db
    .from('providers')
    .select('id, slug, display_name, is_active, adapter, primary_model, fallback_models, base_url, is_default, updated_at')
    .order('display_name');

  return (
    <PageContainer title="AI Engines" description="Manage AI engines, API connections, models, and which engine runs scans. API keys are never displayed back in the UI.">
      <ProvidersClientView providers={(providers ?? []) as any[]} />
    </PageContainer>
  );
}
