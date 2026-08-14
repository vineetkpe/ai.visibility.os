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

function StatusIndicator({ value }: { value: string }) {
  const s = value.toLowerCase();
  const color = s === 'completed' ? 'bg-emerald-500' : s === 'failed' ? 'bg-red-500' : s === 'cancelled' ? 'bg-slate-400' : 'bg-amber-500 animate-pulse';
  const label = s === 'completed' ? 'Completed' : s === 'failed' ? 'Failed' : s === 'cancelled' ? 'Cancelled' : 'Running';
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

export function ScansPremiumClientView({ projectId, initialScans }: Props) {
  const [query, setQuery] = useState('');
  const [starting, setStarting] = useState(false);
  useDashboardRealtime(projectId);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scanHistory', projectId],
    queryFn: async () => {
      const r = await getScanHistoryData(projectId);
      if (!r.success || !r.data) throw new Error(r.error || 'Unable to load scan history');
      return r.data.scans;
    },
    initialData: initialScans,
    staleTime: 10000,
  });
  const scans = data || [];
  const active = scans.some((s) => ['queued', 'pending', 'running', 'processing'].includes(s.status.toLowerCase()));

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => refetch(), 2500);
    return () => window.clearInterval(id);
  }, [active, refetch]);

  const start = async () => {
    setStarting(true);
    try {
      const r = await startVisibilityScanAction(projectId);
      if (r.success) {
        toast.success('Scan started');
        await refetch();
      } else toast.error(r.error || 'Unable to start scan');
    } catch {
      toast.error('Unable to start scan');
    } finally {
      setStarting(false);
    }
  };

  const filtered = scans.filter(
    (s) => !query || s.queryPrompt.toLowerCase().includes(query.toLowerCase()) || s.aiModel.toLowerCase().includes(query.toLowerCase())
  );
  const completed = scans.filter((s) => s.status.toLowerCase() === 'completed').length;
  const failed = scans.filter((s) => s.status.toLowerCase() === 'failed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            <span>OPERATIONAL AUDIT LOG</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Scan History & Evidence
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Complete record of synthetic buyer prompt evaluations across LLM model providers.
          </p>
        </div>
        <Button
          onClick={start}
          disabled={starting || active}
          className="gap-1.5 bg-slate-950 text-white hover:bg-slate-800 font-semibold border border-slate-900 text-xs px-3.5 h-8 shadow-2xs shrink-0"
        >
          {starting || active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 stroke-[2.5]" />}
          <span>{active ? 'Scan Executing...' : 'Run New Scan'}</span>
        </Button>
      </div>

      {/* Metric Stats Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">TOTAL SCANS EXECUTED</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{scans.length}</div>
        </div>
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">COMPLETED VERIFICATIONS</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">{completed}</div>
        </div>
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">FAILED / RETRIED AUDITS</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{failed}</div>
        </div>
      </div>

      {active && (
        <div className="flex items-center gap-2.5 rounded border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs font-mono text-amber-900 shadow-2xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
          <span>ACTIVE AUDIT IN PROGRESS: Polling engine API nodes...</span>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e2e4e9] p-3 sm:flex-row sm:items-center sm:justify-between bg-[#faf9f6]">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by prompt or AI engine..."
              className="w-full rounded border border-[#e2e4e9] bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-950 h-7 px-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Log</span>
          </Button>
        </div>

        {isLoading && !data ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-600" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-xs text-red-600 font-mono">Unable to fetch scan history.</div>
        ) : filtered.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e4e9] bg-[#faf9f6] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Evaluated Prompt</th>
                    <th className="px-4 py-2.5">Engine Model</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Visibility Index</th>
                    <th className="px-4 py-2.5 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e4e9]">
                  {filtered.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-950 max-w-sm truncate">
                        <Link href={`/dashboard/scans/${scan.id}`} className="hover:text-amber-700 transition-colors">
                          {scan.queryPrompt}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{scan.aiModel}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusIndicator value={scan.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">
                        {scan.visibilityScore !== null ? `${scan.visibilityScore} / 100` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/scans/${scan.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                        >
                          <span>Report</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Record List */}
            <div className="md:hidden divide-y divide-[#e2e4e9]">
              {filtered.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/dashboard/scans/${scan.id}`}
                  className="block p-4 hover:bg-slate-50/80 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">{scan.aiModel}</span>
                    <StatusIndicator value={scan.status} />
                  </div>
                  <div className="font-bold text-slate-950 text-xs line-clamp-2">{scan.queryPrompt}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-mono text-slate-400">{new Date(scan.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono font-bold text-slate-950">
                      Score: {scan.visibilityScore !== null ? `${scan.visibilityScore}/100` : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <FileText className="mx-auto h-6 w-6 text-slate-300 mb-2" />
            <div className="font-bold text-slate-900">No scan logs found</div>
            <p className="mt-1 text-slate-500">Run a new brand audit to generate scan history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
