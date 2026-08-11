'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getScanHistoryData, type ScanHistoryItem } from '../actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { Button } from '@/components/ui/button';
import { Scan, Play, Loader2, RefreshCw, Search, CheckCircle2, XCircle, Clock, Globe2, BrainCircuit, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScansClientViewProps {
  projectId: string;
  initialScans?: ScanHistoryItem[];
}

export function ScansClientView({ projectId, initialScans }: ScansClientViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isScanRunning, setIsScanRunning] = useState(
    (initialScans || []).some((scan) => ['queued', 'pending', 'running', 'processing'].includes(scan.status.toLowerCase()))
  );

  useDashboardRealtime(projectId);

  const {
    data: scansData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['scanHistory', projectId],
    queryFn: async () => {
      const res = await getScanHistoryData(projectId);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch scan history.');
      }
      return res.data.scans;
    },
    initialData: initialScans,
    staleTime: 1000 * 10,
  });

  useEffect(() => {
    const hasRunningScan = (scansData || []).some((scan) =>
      ['queued', 'pending', 'running', 'processing'].includes(scan.status.toLowerCase())
    );
    setIsScanRunning(hasRunningScan);
  }, [scansData]);

  useEffect(() => {
    if (!isScanRunning) return;

    const interval = window.setInterval(() => {
      refetch();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isScanRunning, refetch]);

  const handleTriggerScan = async () => {
    setIsTriggering(true);
    setIsScanRunning(true);
    try {
      toast.info('Starting your AI visibility scan...');
      const res = await startVisibilityScanAction(projectId);
      if (res.success) {
        toast.success('Scan started. You can watch its progress below.');
        await refetch();
      } else {
        setIsScanRunning(false);
        toast.error(res.error || 'Failed to start scan.');
      }
    } catch {
      setIsScanRunning(false);
      toast.error('An error occurred while starting scan.');
    } finally {
      setIsTriggering(false);
    }
  };

  const filteredScans = (scansData || []).filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return s.queryPrompt.toLowerCase().includes(term) || s.aiModel.toLowerCase().includes(term);
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'queued':
      case 'pending':
      case 'running':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 font-semibold">
            <Loader2 className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 font-semibold">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scan className="w-7 h-7 text-amber-500" />
            <span>AI Scan History</span>
          </h1>
          <p className="text-xs text-slate-500">
            Log of all prompt evaluation scans executed across AI search engines for this project.
          </p>
        </div>

        <Button
          onClick={handleTriggerScan}
          disabled={isTriggering || isScanRunning}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs gap-1.5 shrink-0"
        >
          {isTriggering || isScanRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              <span>{isTriggering ? 'Starting...' : 'Scan Running...'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Start New Scan</span>
            </>
          )}
        </Button>
      </div>

      {isScanRunning && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-slate-50 p-5 shadow-sm" role="status" aria-live="polite">
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-amber-100">
            <div className="h-full w-1/3 animate-[scan-progress_1.6s_ease-in-out_infinite] rounded-full bg-amber-500" />
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                </span>
                AI Visibility Scan in progress
              </div>
              <p className="mt-1.5 text-xs text-slate-600">Live status is checked automatically. Keep this page open to watch it finish.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center"><Globe2 className="mx-auto mb-1 h-4 w-4" />Crawl</div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center"><BrainCircuit className="mx-auto mb-1 h-4 w-4" />Analyze</div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center"><FileCheck2 className="mx-auto mb-1 h-4 w-4" />Report</div>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="scan-search-input" className="sr-only">Search Scans</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="scan-search-input"
            type="text"
            placeholder="Search scans by query prompt or AI model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs text-slate-500 hover:text-slate-900 gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading && !scansData ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2" role="status" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading scan history...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600 bg-red-50" role="alert">
            {error instanceof Error ? error.message : 'Error loading scan history.'}
          </div>
        ) : filteredScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Query Prompt</th>
                  <th className="p-4">AI Engine</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Visibility Score</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-900 max-w-xs truncate">
                      <Link href={`/dashboard/scans/${scan.id}`} className="hover:text-amber-600 hover:underline">{scan.queryPrompt}</Link>
                    </td>
                    <td className="p-4"><span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">{scan.aiModel}</span></td>
                    <td className="p-4">{getStatusBadge(scan.status)}</td>
                    <td className="p-4 font-bold">
                      {scan.visibilityScore !== null ? (
                        <span className={scan.visibilityScore >= 70 ? 'text-emerald-600' : scan.visibilityScore >= 40 ? 'text-amber-600' : 'text-red-600'}>{scan.visibilityScore}/100</span>
                      ) : <span className="text-slate-400 font-normal italic">Pending</span>}
                    </td>
                    <td className="p-4 text-slate-500" suppressHydrationWarning>{new Date(scan.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-slate-500" suppressHydrationWarning>{scan.completedAt ? new Date(scan.completedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Scan className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">No scans found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">No prompt evaluation scans match your current filter. Trigger a scan to start recording AI search engine responses.</p>
            </div>
            <Button onClick={handleTriggerScan} disabled={isTriggering || isScanRunning} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs">Start First Scan</Button>
          </div>
        )}
      </div>
    </div>
  );
}
