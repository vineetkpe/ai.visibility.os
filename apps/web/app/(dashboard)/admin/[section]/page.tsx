import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Snapshot = {
  users_total: number; projects_total: number; scans_total: number; scans_completed: number; scans_failed: number; scans_running: number; scans_queued: number;
  jobs_total: number; jobs_completed: number; jobs_failed: number; jobs_running: number; jobs_queued: number; pages_total: number; audit_logs_total: number; providers_active: number; providers_total: number;
  daily_scans: { day: string; count: number; failed: number }[]; daily_users: { day: string; count: number }[];
  forecast: { next_30_days_scans: number; next_30_days_new_users: number; daily_scan_run_rate: number; daily_user_run_rate: number };
};
type RpcClient = { rpc(name: string): Promise<{ data: Snapshot | null; error: { message: string } | null }> };

const titles: Record<string, { title: string; description: string }> = {
  analytics: { title: 'Analytics', description: 'Platform-wide trends across users, scans, projects and operations.' },
  forecasts: { title: 'Forecasts', description: 'Capacity and growth projections based on observed platform run rates.' },
  projects: { title: 'Projects', description: 'Portfolio-level project health and platform utilization.' },
  jobs: { title: 'Jobs & automation', description: 'Worker queue, retries and automation health.' },
  reports: { title: 'Reports', description: 'Administrative reporting and operational summaries.' },
  tasks: { title: 'Tasks', description: 'Administrative work queue and follow-up controls.' },
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const meta = titles[section] ?? { title: section.replaceAll('-', ' '), description: 'Administrative platform section.' };
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as RpcClient).rpc('admin_platform_snapshot');
  if (error || !data) throw new Error(error?.message || 'Admin data unavailable');
  const s = data;
  const rows = section === 'analytics' ? [['Users', s.users_total], ['Projects', s.projects_total], ['Scans', s.scans_total], ['Pages', s.pages_total], ['Audit events', s.audit_logs_total]] : section === 'jobs' ? [['Total jobs', s.jobs_total], ['Completed', s.jobs_completed], ['Running', s.jobs_running], ['Queued', s.jobs_queued], ['Failed', s.jobs_failed]] : [['Users', s.users_total], ['Projects', s.projects_total], ['Scans', s.scans_total], ['AI engines', s.providers_active], ['Pages', s.pages_total]];
  return <div className="space-y-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Administration</p><h1 className="mt-1 text-3xl font-bold capitalize tracking-tight">{meta.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{meta.description}</p></div>
    {section === 'forecasts' ? <div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Next 30 days</div><div className="mt-4 text-4xl font-bold">{s.forecast.next_30_days_scans}</div><div className="mt-1 text-sm text-slate-500">Projected AI scans</div><div className="mt-6 text-sm text-slate-600">Current daily run rate: <strong>{s.forecast.daily_scan_run_rate}</strong></div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">User growth</div><div className="mt-4 text-4xl font-bold">{s.forecast.next_30_days_new_users}</div><div className="mt-1 text-sm text-slate-500">Projected new users</div><div className="mt-6 text-sm text-slate-600">Current daily signup rate: <strong>{s.forecast.daily_user_run_rate}</strong></div></div></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{rows.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold">{value}</div></div>)}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">14-day activity</h2><div className="mt-5 space-y-3">{s.daily_scans.map((d) => <div key={d.day} className="flex items-center gap-3"><span className="w-14 text-xs text-slate-400">{d.day}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(100, Math.max(2, (d.count / Math.max(1, ...s.daily_scans.map((x) => x.count))) * 100))}%` }} /></div><span className="w-8 text-right text-xs font-semibold">{d.count}</span></div>)}</div></section>
    <div className="flex gap-3"><Link href="/admin" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">← Dashboard</Link><Link href="/admin/logs" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Audit logs</Link></div>
  </div>;
}
