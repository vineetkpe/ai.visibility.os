'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getScoreAnalyticsData, type ScoreAnalyticsData, type ScoreMetric } from './actions';

function MetricCard({ metric, selected, onSelect }: { metric: ScoreMetric; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded border p-3.5 text-left transition-all ${
        selected ? 'border-slate-950 bg-slate-950 text-white' : 'border-[#e2e4e9] bg-[#faf9f6] text-slate-900 hover:border-slate-400'
      }`}
    >
      <div className="mb-2 flex items-center justify-between font-mono text-[10px]">
        <span className={selected ? 'text-slate-400' : 'text-slate-500'}>{metric.weight}% weight</span>
        <span className="text-xs font-extrabold">{metric.score}/100</span>
      </div>
      <div className="font-bold text-xs">{metric.name}</div>
    </button>
  );
}

export function ScoreClientView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ScoreAnalyticsData | null>(null);
  const [selectedId, setSelectedId] = useState<string>('citation_frequency');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const result = await getScoreAnalyticsData(projectId);
    if (!result.success || !result.data) setError(result.error || 'Unable to load score analytics.');
    else setData(result.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [projectId]);

  if (loading) {
    return <div className="rounded-lg border border-[#e2e4e9] bg-white p-8 text-sm text-slate-500">Loading real score data…</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="font-bold">Score data could not be loaded.</div>
        <div className="mt-1">{error || 'Unknown error.'}</div>
        <Button onClick={load} className="mt-4 bg-slate-950 text-white">Retry</Button>
      </div>
    );
  }

  const selected = data.metrics.find((metric) => metric.id === selectedId) || data.metrics[0];
  const score = data.compositeScore;
  const circumference = 2 * Math.PI * 36;
  const offset = score === null ? circumference : circumference * (1 - score / 100);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-[#e2e4e9] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            <Sparkles className="h-4 w-4 text-slate-900" />
            <span>REAL SCORE ANALYTICS</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">AI Visibility Score</h1>
          <p className="mt-1 text-xs text-slate-600">Calculated from persisted completed scans and citations for {data.project.primaryDomain || data.project.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs"><RefreshCw className="mr-1.5 h-3 w-3" /> Refresh</Button>
          <Button asChild size="sm" className="h-8 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"><Link href="/dashboard"><ArrowLeft className="mr-1.5 h-3 w-3" /> Back</Link></Button>
        </div>
      </div>

      {data.dataStatus === 'insufficient_data' && (
        <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-xs leading-relaxed">
            <div className="font-bold">Not enough real scan data to produce a composite score.</div>
            <div className="mt-1">Completed scans: {data.completedScans}. The score becomes available after at least 3 completed scans. The component metrics below are still calculated from the records that exist.</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6 rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">COMPOSITE INDEX</span>
            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">{data.completedScans} completed scans</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded border border-[#e2e4e9] bg-[#faf9f6] py-6 text-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" className="stroke-slate-200" strokeWidth="6" fill="transparent" />
                {score !== null && <circle cx="45" cy="45" r="36" className="stroke-slate-950" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" />}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-950">{score === null ? '—' : score}</span>
                <span className="text-[9px] font-mono text-slate-400">{score === null ? 'INSUFFICIENT DATA' : 'OUT OF 100'}</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-mono font-bold text-slate-600">
              {score === null ? 'No invented score shown.' : 'Weighted from persisted scan evidence.'}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">MODEL BREAKDOWN</div>
            <div className="divide-y divide-[#e2e4e9] rounded border border-[#e2e4e9] bg-white">
              {data.models.length === 0 ? (
                <div className="p-3 text-xs text-slate-500">No completed model scans yet.</div>
              ) : data.models.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 text-xs">
                  <div><div className="font-semibold text-slate-950">{model.name}</div><div className="font-mono text-[10px] text-slate-400">{model.scans} completed scans</div></div>
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-extrabold text-slate-950">{model.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs">
          <div className="border-b border-[#e2e4e9] pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">SCORE COMPONENTS</span>
            <h2 className="mt-0.5 text-sm font-extrabold text-slate-950">Every number comes from stored evidence</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} selected={metric.id === selected?.id} onSelect={() => setSelectedId(metric.id)} />)}
          </div>

          {selected && (
            <div className="space-y-4 rounded border border-[#e2e4e9] bg-[#faf9f6] p-4">
              <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-2">
                <h3 className="text-xs font-bold text-slate-950">{selected.name}</h3>
                <span className="font-mono text-[10px] font-bold text-slate-700">{selected.score}/100</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">{selected.description}</p>
              <div className="border-t border-[#e2e4e9] pt-2">
                <div className="mb-1 text-[10px] font-mono uppercase text-slate-400">Formula</div>
                <code className="block rounded border border-[#e2e4e9] bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-900">{selected.formula}</code>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{selected.evidence}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
