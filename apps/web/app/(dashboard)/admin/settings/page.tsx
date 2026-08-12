import { createClient } from '@/lib/supabase/server';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { count: providers } = await supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: jobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'queued');
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold tracking-tight">Platform Settings</h1><p className="mt-2 text-sm text-slate-500">Operational controls and configuration areas for the platform.</p></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium">AI engines</p><p className="mt-2 text-2xl font-semibold">{providers ?? 0} active</p><p className="mt-1 text-sm text-slate-500">Manage names, adapters, models, API keys and defaults.</p></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium">Queue</p><p className="mt-2 text-2xl font-semibold">{jobs ?? 0} queued</p><p className="mt-1 text-sm text-slate-500">Monitor worker pressure from the Scans & Jobs page.</p></div></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Destructive controls are intentionally gated.</strong><p className="mt-1">Account deletion must use an explicit email-verification workflow and should never be a one-click admin action.</p></div></div>;
}
