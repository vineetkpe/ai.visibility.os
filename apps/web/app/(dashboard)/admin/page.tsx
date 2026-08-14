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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-[#e2e4e9] pb-5">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            ENTERPRISE CONTROL CENTER
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Platform Operations Console
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Operational status of tenant accounts, brand projects, AI visibility scans, background job queues, and security logs.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded border border-slate-900 bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors shrink-0"
        >
          Open User App →
        </Link>
      </div>

      {/* SYSTEM OVERVIEW KPI STRIP */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, href, note }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs transition-colors hover:border-slate-400"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{label}</span>
              <span className="text-[10px] font-mono font-bold text-slate-700 group-hover:underline">
                View →
              </span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-950">{value}</div>
            <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">{note}</div>
          </Link>
        ))}
      </div>

      {/* Activity & Forecast Section */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-start justify-between border-b border-[#e2e4e9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Scan Volume Activity Throughput</h2>
              <p className="text-xs text-slate-500">14-day trailing volume, with failure events highlighted.</p>
            </div>
            <span className="rounded bg-slate-100 border border-[#e2e4e9] px-2 py-0.5 text-[10px] font-mono font-bold text-slate-900">
              {s.scans_running} RUNNING
            </span>
          </div>
          <div className="flex h-48 items-end gap-2 pt-2">
            {s.daily_scans.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end gap-1">
                <div className="relative flex h-[88%] items-end justify-center">
                  <div
                    title={`${d.count} scans`}
                    className="w-full max-w-6 rounded-t bg-slate-950"
                    style={{ height: `${Math.max(3, (d.count / maxScan) * 100)}%` }}
                  />
                  <div
                    title={`${d.failed} failed`}
                    className="absolute bottom-0 w-1.5 rounded-t bg-red-600"
                    style={{ height: `${Math.max(d.failed ? 5 : 0, (d.failed / maxScan) * 100)}%` }}
                  />
                </div>
                <div className="truncate text-center text-[9px] font-mono text-slate-400">
                  {d.day.replace(' ', '\n')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[11px] text-slate-500 font-mono pt-3 border-t border-[#e2e4e9]">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-slate-950" />
              Total Executed Scans
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-red-600" />
              Failed Scans
            </span>
          </div>
        </section>

        {/* Enterprise Capacity Forecast */}
        <section className="rounded-lg border border-[#e2e4e9] bg-[#faf9f6] p-5 shadow-2xs text-slate-900">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            30-DAY CAPACITY FORECAST
          </p>
          <h2 className="mt-0.5 text-base font-extrabold text-slate-950">System Scaling Run Rate</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Infrastructure load projections computed from 7-day trailing velocity data.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded border border-[#e2e4e9] bg-white p-3 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-950">{s.forecast.next_30_days_scans}</div>
              <div className="mt-0.5 text-[10px] font-mono text-slate-500">Projected Scans</div>
            </div>
            <div className="rounded border border-[#e2e4e9] bg-white p-3 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-950">{s.forecast.next_30_days_new_users}</div>
              <div className="mt-0.5 text-[10px] font-mono text-slate-500">Projected Users</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs font-mono pt-3 border-t border-[#e2e4e9]">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Daily scan rate</span>
              <strong className="text-slate-950">{s.forecast.daily_scan_run_rate}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Daily signup rate</span>
              <strong className="text-slate-950">{s.forecast.daily_user_run_rate}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* System Status Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-[#e2e4e9] bg-white p-4 shadow-2xs">
          <h2 className="font-bold text-slate-950 text-xs">System Reliability Rates</h2>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Scan success rate</span>
              <strong className="text-emerald-700">{successRate}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Job success rate</span>
              <strong className="text-emerald-700">{jobSuccessRate}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pages indexed</span>
              <strong className="text-slate-950">{s.pages_total}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Audit events</span>
              <strong className="text-slate-950">{s.audit_logs_total}</strong>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#e2e4e9] bg-white p-4 shadow-2xs">
          <h2 className="font-bold text-slate-950 text-xs">Background Queue Depth</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="rounded bg-[#faf9f6] border border-[#e2e4e9] p-2.5">
              <div className="text-lg font-bold text-slate-950">{s.jobs_queued}</div>
              <div className="text-[9px] uppercase text-slate-500 font-semibold">Queued</div>
            </div>
            <div className="rounded bg-blue-50 border border-blue-200 p-2.5">
              <div className="text-lg font-bold text-blue-900">{s.jobs_running}</div>
              <div className="text-[9px] uppercase text-blue-800 font-semibold">Running</div>
            </div>
            <div className="rounded bg-rose-50 border border-rose-200 p-2.5">
              <div className="text-lg font-bold text-rose-900">{s.jobs_failed}</div>
              <div className="text-[9px] uppercase text-rose-800 font-semibold">Failed</div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#e2e4e9] bg-white p-4 shadow-2xs">
          <h2 className="font-bold text-slate-950 text-xs">Security Controls</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Owner roles cannot be demoted. Database RLS policies enforce audit log immutability.
          </p>
          <Link
            href="/admin/logs"
            className="mt-3 inline-block text-xs font-mono font-bold text-slate-900 hover:underline"
          >
            Review Audit Logs →
          </Link>
        </section>
      </div>

      {/* Activity Feeds */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-[#e2e4e9] bg-white shadow-2xs">
          <div className="border-b border-[#e2e4e9] px-4 py-3 bg-[#faf9f6]">
            <h2 className="font-bold text-slate-950 text-xs">Recent AI Scans</h2>
            <p className="text-[11px] text-slate-500">Latest execution events across tenant projects.</p>
          </div>
          <div className="divide-y divide-[#e2e4e9]">
            {s.recent_scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-950">
                    {scan.model_name || 'AI Scan Engine'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(scan.created_at).toLocaleString('en-US')}
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-slate-800 border border-[#e2e4e9]">
                  {scan.status}
                </span>
              </div>
            ))}
            {!s.recent_scans.length && (
              <div className="px-4 py-6 text-xs text-slate-500 italic text-center">
                No scan activity recorded yet.
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e2e4e9] bg-white shadow-2xs">
          <div className="border-b border-[#e2e4e9] px-4 py-3 bg-[#faf9f6]">
            <h2 className="font-bold text-slate-950 text-xs">Recent Audit Log</h2>
            <p className="text-[11px] text-slate-500">Security and operations audit trail.</p>
          </div>
          <div className="divide-y divide-[#e2e4e9]">
            {s.recent_activity.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs">
                <div>
                  <div className="font-semibold text-slate-950">{event.action}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {event.resource_type || 'system'} ·{' '}
                    {new Date(event.created_at).toLocaleString('en-US')}
                  </div>
                </div>
              </div>
            ))}
            {!s.recent_activity.length && (
              <div className="px-4 py-6 text-xs text-slate-500 italic text-center">
                No audit activity recorded.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
