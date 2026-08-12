import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const statCards = [
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'projects', label: 'Projects', href: '/admin/users' },
  { key: 'scans', label: 'Total scans', href: '/admin/scans' },
  { key: 'failed', label: 'Failed scans', href: '/admin/scans?status=failed' },
  { key: 'queued', label: 'Queued jobs', href: '/admin/scans?status=queued' },
  { key: 'running', label: 'Running jobs', href: '/admin/scans?status=running' },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ count: users }, { count: projects }, { count: scans }, { count: failed }, { count: queued }, { count: running }, { data: recentScans }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('ai_scans').select('*', { count: 'exact', head: true }),
    supabase.from('ai_scans').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.from('ai_scans').select('id, project_id, status, model_name, created_at, error_message').order('created_at', { ascending: false }).limit(8),
  ]);

  const values: Record<string, number> = { users: users ?? 0, projects: projects ?? 0, scans: scans ?? 0, failed: failed ?? 0, queued: queued ?? 0, running: running ?? 0 };

  return <div className="space-y-8">
    <div><p className="text-sm font-medium text-amber-600">Administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Platform overview</h1><p className="mt-2 text-sm text-slate-500">Users, scans, queue health, AI engines and audit activity in one place.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{statCards.map((card) => <Link key={card.key} href={card.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"><p className="text-sm text-slate-500">{card.label}</p><p className="mt-2 text-3xl font-semibold">{values[card.key]}</p></Link>)}</div>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Recent scans</h2><p className="text-sm text-slate-500">Latest activity across every account.</p></div><div className="divide-y divide-slate-100">{(recentScans ?? []).map((scan) => <div key={scan.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-medium">{scan.model_name || 'AI scan'}</p><p className="text-xs text-slate-500">{new Date(scan.created_at).toLocaleString()} · {scan.id}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase">{scan.status}</span></div>)}{!recentScans?.length && <p className="px-5 py-8 text-sm text-slate-500">No scans yet.</p>}</div></section>
  </div>;
}
