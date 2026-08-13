'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, FileText, Loader2, Play, RefreshCw, Search, XCircle, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { getScanHistoryData, type ScanHistoryItem } from '../actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { Button } from '@/components/ui/button';

interface Props { projectId: string; initialScans?: ScanHistoryItem[]; }

function Status({ value }: { value: string }) {
  const s = value.toLowerCase();
  const cls = s === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : s === 'cancelled' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  const Icon = s === 'completed' ? CheckCircle2 : s === 'failed' || s === 'cancelled' ? XCircle : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}><Icon className="h-3 w-3" />{s === 'completed' ? 'Completed' : s === 'failed' ? 'Failed' : s === 'cancelled' ? 'Cancelled' : 'In progress'}</span>;
}

export function ScansPremiumClientView({ projectId, initialScans }: Props) {
  const [query, setQuery] = useState(''); const [starting, setStarting] = useState(false);
  useDashboardRealtime(projectId);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['scanHistory', projectId], queryFn: async () => { const r = await getScanHistoryData(projectId); if (!r.success || !r.data) throw new Error(r.error || 'Unable to load scan history'); return r.data.scans; }, initialData: initialScans, staleTime: 10000 });
  const scans = data || [];
  const active = scans.some((s) => ['queued', 'pending', 'running', 'processing'].includes(s.status.toLowerCase()));
  useEffect(() => { if (!active) return; const id = window.setInterval(() => refetch(), 2500); return () => window.clearInterval(id); }, [active, refetch]);
  const start = async () => { setStarting(true); try { const r = await startVisibilityScanAction(projectId); if (r.success) { toast.success('Scan started'); await refetch(); } else toast.error(r.error || 'Unable to start scan'); } catch { toast.error('Unable to start scan'); } finally { setStarting(false); } };
  const filtered = scans.filter((s) => !query || s.queryPrompt.toLowerCase().includes(query.toLowerCase()) || s.aiModel.toLowerCase().includes(query.toLowerCase()));
  const completed = scans.filter((s) => s.status.toLowerCase() === 'completed').length; const failed = scans.filter((s) => s.status.toLowerCase() === 'failed').length;

  return <div className="space-y-7 pb-10">
    <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Evidence archive</div><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">Scan history</h1><p className="mt-2 text-sm text-slate-500">Every AI visibility evaluation for this workspace, in one place.</p></div><Button onClick={start} disabled={starting || active} className="gap-2 bg-slate-950 text-white hover:bg-slate-800">{starting || active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{active ? 'Scan running' : 'Start new scan'}</Button></section>
    <section className="grid gap-6 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Total scans</div><div className="mt-2 text-3xl font-semibold tracking-[-.04em]">{scans.length}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Completed</div><div className="mt-2 text-3xl font-semibold tracking-[-.04em]">{completed}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Failed</div><div className="mt-2 text-3xl font-semibold tracking-[-.04em]">{failed}</div></div></section>
    {active && <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><Loader2 className="h-4 w-4 animate-spin" /> A scan is running. This list refreshes automatically.</div>}
    <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts or AI engines" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white" /></div><Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2 text-xs text-slate-500"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button></div>{isLoading && !data ? <div className="p-12 text-center text-sm text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : isError ? <div className="p-12 text-center text-sm text-red-600">Unable to load scan history.</div> : filtered.length ? <div className="divide-y divide-slate-100">{filtered.map((scan) => <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1.6fr)_140px_130px_100px] sm:items-center"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{scan.queryPrompt}</div><div className="mt-1 text-xs text-slate-400">{new Date(scan.createdAt).toLocaleString()}</div></div><div className="text-xs font-medium text-slate-600">{scan.aiModel}</div><div><Status value={scan.status} /></div><div className="text-sm font-semibold text-slate-900 sm:text-right">{scan.visibilityScore !== null ? `${scan.visibilityScore}/100` : '—'}</div></Link>)}</div> : <div className="p-14 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">No scans yet</h2><p className="mt-1 text-sm text-slate-500">Start your first scan to build your AI visibility history.</p><Button onClick={start} disabled={starting} className="mt-5 bg-slate-950">Start first scan</Button></div>}</section>
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500"><span>Each report contains the score, findings, recommendations and supporting evidence.</span><Link href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-950">Back to dashboard <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
  </div>;
}
