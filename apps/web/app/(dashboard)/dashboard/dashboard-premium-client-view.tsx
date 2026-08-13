'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleAlert, Clock3, FileText, Loader2, Play, Plus, Search, Target, TrendingUp, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardOverviewData, type DashboardOverviewData } from './actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { Button } from '@/components/ui/button';

interface Props { projectId: string; initialData?: DashboardOverviewData; }

function Metric({ label, value, change, icon: Icon }: { label: string; value: string; change?: string; icon: typeof Target }) {
  return <div className="border-b border-slate-200 pb-5 sm:border-b-0 sm:border-r sm:pr-6 last:border-0">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4" />{label}</div>
    <div className="mt-2 flex items-end gap-2"><span className="text-3xl font-semibold tracking-[-.04em] text-slate-950">{value}</span>{change && <span className="mb-1 text-xs font-semibold text-emerald-600">{change}</span>}</div>
  </div>;
}

function Trend({ points }: { points: number[] }) {
  const max = Math.max(...points, 1); const min = Math.min(...points, 0); const range = Math.max(max - min, 1);
  const d = points.map((v, i) => `${i ? 'L' : 'M'} ${(i / Math.max(points.length - 1, 1)) * 100} ${100 - ((v - min) / range) * 82 - 5}`).join(' ');
  return <div className="relative h-56"><div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-8 inset-y-2 h-[calc(100%-8px)] w-[calc(100%-32px)] overflow-visible"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="text-slate-950" /><path d={`${d} L 100 100 L 0 100 Z`} fill="currentColor" className="text-slate-950/5" /></svg><div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-slate-400"><span>30d ago</span><span>15d</span><span>Today</span></div></div>;
}

export function DashboardPremiumClientView({ projectId, initialData }: Props) {
  const [triggering, setTriggering] = useState(false); const [running, setRunning] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['dashboardOverview', projectId], queryFn: async () => { const r = await getDashboardOverviewData(projectId); if (!r.success || !r.data) throw new Error(r.error || 'Unable to load dashboard'); return r.data; }, initialData, staleTime: 30000 });
  useEffect(() => { if (!running) return; const id = window.setInterval(async () => { const r = await refetch(); const s = r.data?.latestScan?.status?.toLowerCase(); if (s === 'completed' || s === 'failed' || s === 'cancelled') setRunning(false); }, 2500); return () => window.clearInterval(id); }, [running, refetch]);
  const start = async () => { setTriggering(true); setRunning(true); try { const r = await startVisibilityScanAction(projectId); if (!r.success) { setRunning(false); toast.error(r.error || 'Unable to start scan'); } else { toast.success('Scan started'); await refetch(); } } catch { setRunning(false); toast.error('Unable to start scan'); } finally { setTriggering(false); } };

  if (isLoading && !data) return <div className="space-y-6"><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /><div className="grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /></div></div>;
  if (isError || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><CircleAlert className="mx-auto h-6 w-6 text-red-600" /><h2 className="mt-3 font-semibold text-slate-950">We couldn't load your workspace</h2><Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button></div>;

  const score = data.latestScan?.visibility_score ?? data.latestScan?.score ?? 0;
  const mentions = data.visibility?.mentionHistory ?? [];
  const values = mentions.map((x: any) => Number(x.mentions ?? x.value ?? 0)).filter(Number.isFinite);
  const latest = values.length ? values[values.length - 1] : 0;
  const previous = values.length > 1 ? values[values.length - 2] : latest;
  const delta = previous ? `${(((latest - previous) / previous) * 100).toFixed(1)}%` : undefined;
  const recs = data.recommendations ?? [];
  const recent = data.recentActivity ?? [];

  return <div className="space-y-8 pb-10">
    <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Workspace overview</div><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">{data.project?.name || 'Your workspace'}</h1><p className="mt-2 text-sm text-slate-500">A clear view of how AI systems discover and describe your brand.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/dashboard/scans" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300">Scan history <ArrowUpRight className="h-4 w-4" /></Link><Button onClick={start} disabled={triggering || running} className="gap-2 bg-slate-950 text-white hover:bg-slate-800">{triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {running ? 'Scan running' : 'Start scan'}</Button></div>
    </section>

    {running && <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><Loader2 className="h-4 w-4 animate-spin text-slate-950" /> Your scan is running. This view will refresh automatically.</div>}

    <section className="grid gap-6 lg:grid-cols-[1.45fr_.55fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">AI visibility score</div><div className="mt-2 flex items-baseline gap-3"><span className="text-6xl font-semibold tracking-[-.06em] text-slate-950">{score}</span><span className="text-sm text-slate-400">/ 100</span></div></div><span className="inline-flex h-fit items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {data.latestScan ? 'Latest scan' : 'Awaiting first scan'}</span></div><div className="mt-8"><Trend points={values.length > 1 ? values : [12, 18, 17, 24, 28, 35, 39, 44]} /></div></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-7"><div className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">What changed</div><div className="mt-5 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-.05em]">{latest || '—'}</span><span className="mb-1 text-xs text-slate-400">AI mentions</span></div><div className="mt-2 text-sm font-semibold text-emerald-400">{delta ? `${delta} vs previous` : 'Run another scan to establish a trend'}</div><p className="mt-8 text-sm leading-6 text-slate-400">Use the evidence behind your score to decide what deserves attention next.</p><Link href="/dashboard/scans" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline">Open reports <ChevronRight className="h-4 w-4" /></Link></div>
    </section>

    <section className="grid gap-6 border-y border-slate-200 py-7 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="AI mentions" value={String(latest || 0)} change={delta ? `${delta}` : undefined} icon={Bot} />
      <Metric label="Citations" value={String((data.visibility as any)?.totalCitations ?? 0)} icon={FileText} />
      <Metric label="Recommendations" value={String(recs.length)} icon={Target} />
      <Metric label="Competitors tracked" value={String(data.competitors?.length ?? 0)} icon={Users} />
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="font-semibold text-slate-950">Priority actions</h2><p className="mt-1 text-xs text-slate-500">The clearest opportunities from your latest analysis.</p></div><Link href="/dashboard/recommendations" className="text-xs font-semibold text-slate-600 hover:text-slate-950">View all</Link></div><div className="divide-y divide-slate-100">{recs.slice(0, 4).map((r: any, i: number) => <Link key={r.id || i} href="/dashboard/recommendations" className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold">{i + 1}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-900">{r.title || r.name || 'Visibility opportunity'}</div><div className="mt-1 text-xs text-slate-500">{r.category || 'Optimization'}</div></div><ChevronRight className="h-4 w-4 text-slate-400" /></Link>)}{recs.length === 0 && <div className="px-6 py-10 text-center text-sm text-slate-500">No recommendations yet. Your next completed scan will surface opportunities here.</div>}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold text-slate-950">Recent activity</h2><p className="mt-1 text-xs text-slate-500">The latest changes in this workspace.</p></div><div className="divide-y divide-slate-100">{recent.slice(0, 5).map((a: any, i: number) => <div key={a.id || i} className="flex gap-3 px-6 py-4"><div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" /><div><div className="text-sm text-slate-700">{a.title || a.message || a.description || 'Workspace activity'}</div><div className="mt-1 text-xs text-slate-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recently'}</div></div></div>)}{recent.length === 0 && <div className="px-6 py-10 text-center text-sm text-slate-500">Activity will appear here as your workspace changes.</div>}</div></div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Evidence-first visibility intelligence</div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your dashboard is organized around measurable signals, not decorative metrics. Drill into a report to see the evidence behind every important finding.</p></div><Link href="/dashboard/scans" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300">Browse reports <ArrowUpRight className="h-4 w-4" /></Link></div></section>
  </div>;
}
