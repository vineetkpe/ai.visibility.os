'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getScanHistoryData, type ScanHistoryItem } from '../actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { Button } from '@/components/ui/button';
import {
  Scan,
  Play,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScansClientViewProps {
  projectId: string;
  initialScans?: ScanHistoryItem[];
}

export function ScansClientView({ projectId, initialScans }: ScansClientViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);

  // 1. Supabase Realtime live subscriptions for live scan status updates
  useDashboardRealtime(projectId);

  // 2. TanStack Query
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
    staleTime: 1000 * 30,
  });

  const handleTriggerScan = async () => {
    setIsTriggering(true);
    try {
      toast.info('Dispatching AI Visibility Engine scan task...');
      const res = await startVisibilityScanAction(projectId);
      if (res.success) {
        toast.success('Visibility scan dispatched! Live status updates will reflect automatically.');
        refetch();
      } else {
        toast.error(res.error || 'Failed to dispatch scan.');
      }
    } catch {
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
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'running':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold">
            <Loader2 className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 font-semibold">
            <XCircle className="w-3 h-3" /> Failed
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
      {/* Header Controls */}
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
          disabled={isTriggering}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs gap-1.5 shrink-0"
        >
          {isTriggering ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              <span>Dispatching...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Start New Scan</span>
            </>
          )}
        </Button>
      </div>

      {/* Filter Bar */}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="text-xs text-slate-500 hover:text-slate-900 gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Scan History Table */}
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
                      <Link href={`/dashboard/scans/${scan.id}`} className="hover:text-amber-600 hover:underline">
                        {scan.queryPrompt}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {scan.aiModel}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(scan.status)}</td>
                    <td className="p-4 font-bold">
                      {scan.visibilityScore !== null ? (
                        <span
                          className={
                            scan.visibilityScore >= 70
                              ? 'text-emerald-600'
                              : scan.visibilityScore >= 40
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {scan.visibilityScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(scan.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-500">
                      {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : '—'}
                    </td>
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
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No prompt evaluation scans match your current filter. Trigger a scan to start recording AI search engine responses.
              </p>
            </div>
            <Button
              onClick={handleTriggerScan}
              disabled={isTriggering}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
            >
              Start First Scan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
