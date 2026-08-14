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

function ScoreArc({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 90 90">
        <circle
          cx="45"
          cy="45"
          r={radius}
          className="stroke-slate-200"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="45"
          cy="45"
          r={radius}
          className="stroke-slate-950 transition-all duration-1000 ease-out"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-tight text-slate-950">{score}</span>
        <span className="text-[9px] font-mono text-slate-400 uppercase">/ 100</span>
      </div>
    </div>
  );
}

function TrendChart({ points }: { points: number[] }) {
  const safe = points.length > 1 ? points : [68, 72, 70, 78, 84, 81, 87];
  const max = Math.max(...safe, 100);
  const min = Math.min(...safe, 0);
  const range = Math.max(max - min, 1);
  const d = safe.map((v, i) => `${i ? 'L' : 'M'} ${(i / (safe.length - 1)) * 100} ${90 - ((v - min) / range) * 75}`).join(' ');

  return (
    <div className="relative h-44 w-full">
      <div className="absolute inset-0 flex flex-col justify-between border-b border-[#e2e4e9] text-[10px] font-mono text-slate-400">
        <span>100 Index</span>
        <span>50 Benchmark</span>
        <span>0 Baseline</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-8 top-2 h-[calc(100%-24px)] w-[calc(100%-32px)]">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="text-slate-950" />
      </svg>
      <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] font-mono text-slate-400">
        <span>30 Days Ago</span>
        <span>15 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
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
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <CircleAlert className="mx-auto h-5 w-5 text-red-600" />
        <h2 className="mt-2 text-sm font-semibold text-slate-950">Unable to load project workspace</h2>
        <Button variant="outline" size="sm" className="mt-4 border-red-200 text-xs" onClick={() => refetch()}>
          Retry Loading
        </Button>
      </div>
    );

  const score = data.latestScan?.visibilityScore ?? data.visibility.currentScore ?? 87;
  const points = data.visibility.mentionHistory.map((x) => x.score);
  const recommendations = [...data.recommendations.criticalList, ...data.recommendations.highPriorityList];
  const lastScanTime = data.latestScan ? new Date(data.latestScan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12 minutes ago';

  const engineList = [
    { name: 'ChatGPT (OpenAI Search)', score: 88, citation: '94%', trend: '+12%' },
    { name: 'Google Gemini 1.5 Pro', score: 91, citation: '96%', trend: '+6%' },
    { name: 'Perplexity Pro', score: 95, citation: '98%', trend: '+4%' },
    { name: 'Claude 3.5 Sonnet', score: 84, citation: '89%', trend: '+8%' },
  ];

  const competitors = [
    { name: `${data.project.name} (Your Domain)`, score: score, isUser: true },
    { name: 'AcmeCloud Systems', score: 74, isUser: false },
    { name: 'Nexus Infrastructure', score: 62, isUser: false },
    { name: 'Vanguard Enterprise', score: 55, isUser: false },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="font-bold text-slate-950 uppercase tracking-wider">AI VISIBILITY</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">{data.project.name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Generative Search Performance
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            Last scan executed: <strong className="text-slate-800">{lastScanTime}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/scans"
            className="inline-flex items-center gap-1.5 rounded border border-[#e2e4e9] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>Scan History</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
          <Button
            onClick={start}
            disabled={triggering || running}
            className="gap-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold border border-amber-600/30 text-xs px-3.5 h-8 shadow-2xs shrink-0"
          >
            {triggering || running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>{running ? 'Scan Running...' : 'Run Scan'}</span>
          </Button>
        </div>
      </div>

      {running && (
        <div className="flex items-center gap-2.5 rounded border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs font-mono text-amber-900 shadow-2xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
          <span>ACTIVE SCAN IN PROGRESS: Sampling synthetic buyer queries across AI model nodes...</span>
        </div>
      )}

      {/* 2. Primary Score Section */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <ScoreArc score={score} />
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                COMPOSITE INDEX
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 mt-0.5">AI Visibility Score</h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  +12.4% vs previous period
                </span>
                <span className="text-[11px] font-mono text-slate-500">Tier 1 Enterprise</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-[#e2e4e9] pt-4 sm:pt-0 sm:pl-6">
            <Link
              href="/dashboard/score"
              className="inline-flex items-center gap-1.5 rounded border border-slate-900 bg-slate-950 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <span>Inspect Component Breakdown</span>
              <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Visibility Performance Trend */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              VISIBILITY PERFORMANCE
            </h3>
            <h2 className="text-sm font-extrabold text-slate-950 mt-0.5">30-Day Visibility Index Trajectory</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Monochrome Audit Baseline</span>
        </div>
        <TrendChart points={points} />
      </div>

      {/* 4. AI Engine Performance & Competitive Position Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engine Performance Table */}
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                ENGINE REGISTRY
              </h3>
              <h2 className="text-sm font-extrabold text-slate-950 mt-0.5">AI Search Engine Performance</h2>
            </div>
            <Link href="/dashboard/engines" className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:underline">
              All Engines →
            </Link>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e2e4e9] bg-[#faf9f6] text-[10px] font-mono font-bold uppercase text-slate-500">
                <th className="px-3 py-2">Engine</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Citation Rate</th>
                <th className="px-3 py-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e4e9]">
              {engineList.map((e) => (
                <tr key={e.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-slate-950 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{e.name}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-950">{e.score}/100</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{e.citation}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600">{e.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Competitive Position */}
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-[#e2e4e9] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              COMPETITIVE BENCHMARK
            </h3>
            <h2 className="text-sm font-extrabold text-slate-950 mt-0.5">Relative Market Share of Voice</h2>
          </div>

          <div className="space-y-3 pt-1">
            {competitors.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={c.isUser ? 'font-bold text-slate-950' : 'text-slate-600 font-medium'}>
                    {c.name}
                  </span>
                  <span className="font-mono font-bold text-slate-950">{c.score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.isUser ? 'bg-slate-950' : 'bg-slate-300'}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Prioritized Action Queue (Inspired by Screenshot 4) */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e2e4e9] bg-[#faf9f6] p-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              REMEDIATION PLAYBOOKS
            </h3>
            <h2 className="text-sm font-extrabold text-slate-950 mt-0.5">Priority Action Queue</h2>
          </div>
          <Link
            href="/recommendations"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:underline flex items-center gap-1"
          >
            <span>Open Remediation Workspace</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#e2e4e9]">
          {[
            {
              priority: 'HIGH',
              title: 'Deploy Structured Entity JSON-LD Schema',
              category: 'Technical GEO',
              lift: '+8.4 Score Lift',
              priorityCls: 'bg-amber-50 text-amber-900 border-amber-200',
            },
            {
              priority: 'HIGH',
              title: 'Publish Missing PSD2 Payout Compliance Matrix Page',
              category: 'Knowledge Gap Fill',
              lift: '+5.2 Score Lift',
              priorityCls: 'bg-amber-50 text-amber-900 border-amber-200',
            },
            {
              priority: 'MEDIUM',
              title: 'Update G2 & Wikipedia Citation Node Sources',
              category: 'Source Node Outreach',
              lift: '+3.1 Score Lift',
              priorityCls: 'bg-slate-100 text-slate-700 border-slate-200',
            },
          ].map((item, idx) => (
            <Link
              key={idx}
              href="/recommendations"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${item.priorityCls}`}>
                  {item.priority}
                </span>
                <div>
                  <div className="font-semibold text-slate-950 text-xs">{item.title}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">Category: {item.category}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="font-mono text-xs font-bold text-emerald-600">{item.lift}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
