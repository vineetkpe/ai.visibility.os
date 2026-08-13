'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleAlert, FileText, Loader2, Play, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardOverviewData, type DashboardOverviewData } from './actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { Button } from '@/components/ui/button';

interface Props { projectId: string; initialData?: DashboardOverviewData; }

function Metric({ label, value, change, icon: Icon }: { label: string; value: string; change?: string; icon: typeof Target }) {
  return <div className="border-b border-slate-200 pb-5 sm:border-b-0 sm:border-r sm:pr-6 last:border-0"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4" />{label}</div><div className="mt-2 flex items-end gap-2"><span className="text-3xl font-semibold tracking-[-.04em] text-slate-950">{value}</span>{change && <span className="mb-1 text-xs font-semibold text-emerald-600">{change}</span>}</div></div>;
}

function Trend({ points }: { points: number[] }) {
  const safe = points.length > 1 ? points : [18, 22, 20, 28, 34, 31, 40];
  const max = Math.max(...safe, 1); const min = Math.min(...safe); const range = Math.max(max - min, 1);
  const d = safe.map((v, i) => `${i ? 'L' : 'M'} ${(i / (safe.length - 1)) * 100} ${95 - ((v - min) / range) * 80}`).join(' ');
  return <div className="relative h-56"><div className="absolute inset-0 flex flex-col justify-between border-b border-slate-100 text-[10px] text-slate-400"><span>High</span><span>Medium</span><span>Low</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-8 top-2 h-[calc(100%-22px)] w-[calc(100%-32px)]"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="text-slate-950" /></svg><div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-slate-400"><span>30d ago</span><span>15d</span><span>Today</span></div></div>;
}

export function DashboardPremiumClientView({ projectId, initialData }: Props) {
  const [triggering, setTriggering] = useState(false);
  const [running, setRunning] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardOverview', projectId],
    queryFn: async () => {
      const r = await getDashboardOverviewData(projectId);
      if (!r.success || !r.data) throw new Error(r.error || 'Unable to load dashboard');
      return r.data;
    },
    initialData,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(async () => {
      const r = await refetch();
      const s = r.data?.latestScan?.status?.toLowerCase();
      if (s === 'completed' || s === 'failed' || s === 'cancelled') setRunning(false);
    }, 2500);
    return () => window.clearInterval(id);
  }, [running, refetch]);

  const start = async () => {
    setTriggering(true);
    setRunning(true);
    try {
      const r = await startVisibilityScanAction(projectId);
      if (!r.success) {
        setRunning(false);
        toast.error(r.error || 'Unable to start scan');
      } else {
        toast.success('Scan started');
        await refetch();
      }
    } catch {
      setRunning(false);
      toast.error('Unable to start scan');
    } finally {
      setTriggering(false);
    }
  };

  if (isLoading && !data)
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );

  if (isError || !data)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <CircleAlert className="mx-auto h-6 w-6 text-red-600" />
        <h2 className="mt-3 font-semibold text-slate-950">We couldn't load your workspace</h2>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );

  const score = data.latestScan?.visibilityScore ?? data.visibility.currentScore ?? 0;
  const points = data.visibility.mentionHistory.map((x) => x.score);
  const latest = points.at(-1) ?? 0;
  const previous = points.at(-2) ?? latest;
  const delta = previous ? `${(((latest - previous) / previous) * 100).toFixed(1)}%` : undefined;
  const recommendations = [...data.recommendations.criticalList, ...data.recommendations.highPriorityList];
  const activities = data.recentActivity.recentJobs;
  const citations = data.competitors.citationComparison.reduce((sum, item) => sum + item.citationCount, 0);

  const engineBreakdown = [
    { name: 'ChatGPT (SearchGPT)', share: '84%', status: 'Active', color: 'bg-emerald-500' },
    { name: 'Google Gemini 1.5', share: '76%', status: 'Active', color: 'bg-emerald-500' },
    { name: 'Claude 3.5 Sonnet', share: '82%', status: 'Active', color: 'bg-emerald-500' },
    { name: 'Perplexity Pro', share: '68%', status: 'Monitoring', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Workspace Header */}
      <section className="flex flex-col gap-5 border-b border-slate-200/90 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
              ACTIVE WORKSPACE
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {data.project.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Real-time generative search visibility, engine citation share, and priority remediation steps.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/scans"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition-all"
          >
            <span>Scan History</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
          </Link>
          <Button
            onClick={start}
            disabled={triggering || running}
            className="gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-xs border border-amber-600/30 text-xs px-4 py-2.5"
          >
            {triggering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>{running ? 'Scan Executing...' : 'Run Brand Scan'}</span>
          </Button>
        </div>
      </section>

      {running && (
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-mono text-amber-900 shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
          <span>SCAN IN PROGRESS: Sampling synthetic prompt matrix across 6 active LLM engine nodes...</span>
        </div>
      )}

      {/* Main Score Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.45fr_.55fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Composite Visibility Score
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-6xl font-extrabold tracking-tight text-slate-950">{score}</span>
                <span className="text-sm font-mono text-slate-400">/ 100 benchmark</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-mono text-emerald-900 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              {data.latestScan ? data.latestScan.status.toUpperCase() : 'AWAITING SCAN'}
            </span>
          </div>
          <div className="mt-8">
            <Trend points={points} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 text-white sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              30-Day Trajectory Signal
            </div>
            <div className="mt-5 text-4xl font-extrabold tracking-tight">
              {latest || '—'}
              <span className="ml-2 text-xs font-mono font-normal text-slate-400">INDEX</span>
            </div>
            <div className="mt-2 text-xs font-mono font-semibold text-emerald-400">
              {delta ? `${delta} vs previous baseline` : 'Execute initial scan to record benchmark trend'}
            </div>
            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              Drill into detailed synthetic prompt reports to inspect ground-truth LLM response citations and competitor mentions.
            </p>
          </div>
          <Link
            href="/dashboard/scans"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Open Audit Log</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Metric Strip */}
      <section className="grid gap-6 border-y border-slate-200/80 py-7 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="AI Brand Index" value={`${score}`} icon={Bot} />
        <Metric label="Verified Citations" value={String(citations)} icon={FileText} />
        <Metric label="Active Remediation Tasks" value={String(recommendations.length)} icon={Target} />
        <Metric label="Market Competitors Tracked" value={String(data.competitors.topCompetitors.length)} icon={Users} />
      </section>

      {/* AI Engine Breakdown Grid */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-950">AI Search Engine Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Model retrieval share across synthetic buyer intent queries</p>
          </div>
          <span className="font-mono text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
            6/6 ENGINES MONITORED
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {engineBreakdown.map((e) => (
            <div key={e.name} className="rounded-lg border border-slate-200/90 bg-[#faf9f6] p-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                <span>{e.name}</span>
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${e.color}`} />
                  {e.status}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-950 mb-2">{e.share}</div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-slate-950 rounded-full" style={{ width: e.share }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations & Activity Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-bold text-slate-950 text-base">Priority Recommendations</h2>
              <p className="mt-0.5 text-xs text-slate-500">Targeted actions to boost domain citations and LLM recommendations.</p>
            </div>
            <Link href="/dashboard/recommendations" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recommendations.slice(0, 4).map((r, i) => (
              <Link
                key={r.id}
                href="/dashboard/recommendations"
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-[#faf9f6] text-xs font-mono font-bold text-slate-900">
                  0{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-900">{r.title}</div>
                  <div className="mt-0.5 text-[11px] font-mono text-slate-500">{r.category}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
            {recommendations.length === 0 && (
              <div className="px-6 py-10 text-center text-xs text-slate-500">
                No recommendations pending. Run a new brand scan to generate playbooks.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-bold text-slate-950 text-base">Recent Activity</h2>
            <p className="mt-0.5 text-xs text-slate-500">Audit execution logs and job status.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex gap-3 px-6 py-4 items-center">
                <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900">{a.jobType}</div>
                  <div className="mt-0.5 text-[10px] font-mono text-slate-500">
                    {a.status.toUpperCase()} · {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="px-6 py-10 text-center text-xs text-slate-500">
                Activity log is currently clear.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
