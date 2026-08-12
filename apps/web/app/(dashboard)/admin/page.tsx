import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Snapshot = {
  users_total: number; users_admin: number; users_owner: number; users_onboarded: number; users_active_7d: number;
  projects_total: number; scans_total: number; scans_completed: number; scans_failed: number; scans_running: number; scans_queued: number;
  jobs_total: number; jobs_completed: number; jobs_failed: number; jobs_running: number; jobs_queued: number;
  pages_total: number; audit_logs_total: number; providers_active: number; providers_total: number;
  daily_scans: { day: string; count: number; failed: number }[];
  recent_scans: { id: string; status: string; model_name: string | null; created_at: string; error_message: string | null }[];
  recent_activity: { id: string; action: string; resource_type: string | null; created_at: string; actor_user_id: string | null }[];
  forecast: { next_30_days_scans: number; next_30_days_new_users: number; daily_scan_run_rate: number; daily_user_run_rate: number };
};

type RpcClient = { rpc(name: string): Promise<{ data: Snapshot | null; error: { message: string } | null }> };
type DashboardCard = { label: string; value: number; href: string; note: string };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as RpcClient).rpc('admin_platform_snapshot');
  if (error || !data) throw new Error(error?.message || 'Admin dashboard data unavailable');
  const s = data;
  const maxScan = Math.max(1, ...s.daily_scans.map((d) => d.count));
  const successRate = s.scans_total ? Math.round((s.scans_completed / s.scans_total) * 100) : 0;
  const jobSuccessRate = s.jobs_total ? Math.round((s.jobs_completed / s.jobs_total) * 100) : 0;
  const cards: DashboardCard[] = [
    { label: 'Users', value: s.users_total, href: '/admin/users', note: `${s.users_active_7d} active in 7d` },
    { label: 'Projects', value: s.projects_total, href: '/admin/projects', note: 'Active projects' },
    { label: 'AI scans', value: s.scans_total, href: '/admin/scans', note: `${successRate}% completed` },
    { label: 'Failed scans', value: s.scans_failed, href: '/admin/scans?status=failed', note: s.scans_failed ? 'Needs attention' : 'Healthy' },
    { label: 'Jobs', value: s.jobs_total, href: '/admin/jobs', note: `${s.jobs_running} running · ${s.jobs_queued} queued` },
    { label: 'AI engines', value: s.providers_active, href: '/admin/providers', note: `${s.providers_total} configured` },
  ];

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Control center</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Platform dashboard</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">A complete operational view of accounts, projects, AI visibility scans, workers, engines and security activity.</p></div><Link href="/dashboard" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open user application</Link></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, href, note }) => <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="text-xs font-semibold text-slate-400 group-hover:text-amber-600">View →</span></div><div className="mt-3 text-3xl font-bold tracking-tight">{value}</div><div className="mt-2 text-xs text-slate-500">{note}</div></Link>)}</div>

    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold">Scan activity</h2><p className="text-sm text-slate-500">Last 14 days, with failed scans highlighted.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{s.scans_running} running</span></div><div className="flex h-64 items-end gap-2">{s.daily_scans.map((d) => <div key={d.day} className="flex h-full flex-1 flex-col justify-end gap-1"><div className="relative flex h-[88%] items-end justify-center"><div title={`${d.count} scans`} className="w-full max-w-7 rounded-t bg-slate-900/85" style={{ height: `${Math.max(3, (d.count / maxScan) * 100)}%` }} /><div title={`${d.failed} failed`} className="absolute bottom-0 w-2 rounded-t bg-rose-500" style={{ height: `${Math.max(d.failed ? 5 : 0, (d.failed / maxScan) * 100)}%` }} /></div><div className="truncate text-center text-[10px] text-slate-400">{d.day.replace(' ', '\n')}</div></div>)}</div><div className="mt-4 flex gap-5 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-slate-900" />Total scans</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-500" />Failed</span></div></section>

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">30-day forecast</p><h2 className="mt-2 text-xl font-semibold">Capacity outlook</h2><p className="mt-2 text-sm text-slate-400">Projection uses the platform's trailing 7-day run rate. It is an operational forecast, not fabricated historical data.</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-4"><div className="text-2xl font-bold">{s.forecast.next_30_days_scans}</div><div className="mt-1 text-xs text-slate-400">Projected scans</div></div><div className="rounded-xl bg-white/5 p-4"><div className="text-2xl font-bold">{s.forecast.next_30_days_new_users}</div><div className="mt-1 text-xs text-slate-400">Projected new users</div></div></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-400">Daily scan rate</span><strong>{s.forecast.daily_scan_run_rate}</strong></div><div className="flex justify-between"><span className="text-slate-400">Daily signup rate</span><strong>{s.forecast.daily_user_run_rate}</strong></div></div></section>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">System health</h2><div className="mt-4 space-y-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Scan success rate</span><strong>{successRate}%</strong></div><div className="flex justify-between"><span className="text-slate-500">Job success rate</span><strong>{jobSuccessRate}%</strong></div><div className="flex justify-between"><span className="text-slate-500">Pages indexed</span><strong>{s.pages_total}</strong></div><div className="flex justify-between"><span className="text-slate-500">Audit events</span><strong>{s.audit_logs_total}</strong></div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Queue status</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-amber-50 p-3"><div className="text-xl font-bold text-amber-700">{s.jobs_queued}</div><div className="text-[11px] text-slate-500">Queued</div></div><div className="rounded-xl bg-blue-50 p-3"><div className="text-xl font-bold text-blue-700">{s.jobs_running}</div><div className="text-[11px] text-slate-500">Running</div></div><div className="rounded-xl bg-rose-50 p-3"><div className="text-xl font-bold text-rose-700">{s.jobs_failed}</div><div className="text-[11px] text-slate-500">Failed</div></div></div></section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><h2 className="font-semibold text-amber-950">Security lock</h2><p className="mt-2 text-sm text-amber-900/80">Owner accounts cannot be demoted. Admin and owner accounts cannot be deleted at the database layer.</p><Link href="/admin/logs" className="mt-4 inline-block text-sm font-semibold text-amber-900">Review audit security →</Link></section>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Recent AI activity</h2><p className="text-sm text-slate-500">Latest scans from every account.</p></div><div className="divide-y divide-slate-100">{s.recent_scans.map((scan) => <div key={scan.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><div className="truncate text-sm font-medium">{scan.model_name || 'AI scan'}</div><div className="text-xs text-slate-400">{new Date(scan.created_at).toLocaleString()}</div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase">{scan.status}</span></div>)}{!s.recent_scans.length && <div className="px-5 py-8 text-sm text-slate-500">No scan activity yet.</div>}</div></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Recent audit activity</h2><p className="text-sm text-slate-500">Security and administrative events.</p></div><div className="divide-y divide-slate-100">{s.recent_activity.map((event) => <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><div className="text-sm font-medium">{event.action}</div><div className="text-xs text-slate-400">{event.resource_type || 'system'} · {new Date(event.created_at).toLocaleString()}</div></div></div>)}{!s.recent_activity.length && <div className="px-5 py-8 text-sm text-slate-500">No audit activity yet.</div>}</div></section>
    </div>
  </div>;
}
