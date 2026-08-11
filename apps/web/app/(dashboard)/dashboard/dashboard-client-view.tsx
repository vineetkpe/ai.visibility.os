'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardOverviewData, type DashboardOverviewData } from './actions';
import { startVisibilityScanAction } from '@/app/(dashboard)/projects/scan-actions';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import {
  ProjectOverviewWidget,
  VisibilityTrendChart,
  AIPlatformBreakdownWidget,
  CompetitorBenchmarkingWidget,
  RecommendationsSummaryWidget,
  WebsiteHealthWidget,
  RecentActivityWidget,
} from '@/components/dashboard/dashboard-widgets';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Sparkles, FolderPlus, Globe2, BrainCircuit, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardClientViewProps {
  projectId: string;
  initialData?: DashboardOverviewData;
}

export function DashboardClientView({ projectId, initialData }: DashboardClientViewProps) {
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);
  const [isScanRunning, setIsScanRunning] = useState(false);

  useDashboardRealtime(projectId);

  const {
    data: overviewData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboardOverview', projectId],
    queryFn: async () => {
      const res = await getDashboardOverviewData(projectId);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to load dashboard metrics.');
      }
      return res.data;
    },
    initialData,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!isScanRunning) return;

    const interval = window.setInterval(async () => {
      const result = await refetch();
      const status = result.data?.latestScan?.status?.toLowerCase();
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        setIsScanRunning(false);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isScanRunning, refetch]);

  const handleTriggerScan = async () => {
    setIsTriggeringScan(true);
    setIsScanRunning(true);
    try {
      toast.info('Starting your AI visibility scan...');
      const res = await startVisibilityScanAction(projectId);
      if (res.success) {
        toast.success('Scan started. You can watch the progress below.');
        await refetch();
      } else {
        setIsScanRunning(false);
        toast.error(res.error || 'Failed to start visibility scan.');
      }
    } catch {
      setIsScanRunning(false);
      toast.error('An unexpected error occurred while starting visibility scan.');
    } finally {
      setIsTriggeringScan(false);
    }
  };

  if (isLoading && !overviewData) {
    return (
      <div className="p-8 space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading dashboard metrics...</span>
        <div className="h-32 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <h3 className="text-base font-semibold text-red-800">Failed to load Dashboard metrics</h3>
          <p className="text-xs text-red-600">
            {error instanceof Error ? error.message : 'An error occurred while fetching metrics.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <EmptyState
        icon={<FolderPlus className="h-8 w-8 text-slate-400" />}
        title="No project found"
        description="Create your first project to start tracking AI visibility."
      />
    );
  }

  const hasNoScans = !overviewData.latestScan;

  return (
    <div className="space-y-6">
      <ProjectOverviewWidget
        project={overviewData.project}
        latestScan={overviewData.latestScan}
        onTriggerScan={handleTriggerScan}
        isTriggering={isTriggeringScan}
      />

      {isScanRunning && (
        <section
          className="relative overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-slate-50 p-6 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-amber-100">
            <div className="h-full w-1/3 animate-[scan-progress_1.6s_ease-in-out_infinite] rounded-full bg-amber-500" />
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                </span>
                AI Visibility Scan in progress
              </div>
              <p className="mt-2 text-xs text-slate-600">
                We&apos;re collecting your site signals and evaluating AI visibility. This page will update automatically.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                <Globe2 className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                Crawl
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                <BrainCircuit className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                Analyze
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                <FileCheck2 className="mx-auto mb-1 h-4 w-4 text-slate-500" />
                Report
              </div>
            </div>
          </div>
        </section>
      )}

      {hasNoScans && !isScanRunning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Your first scan is the next step</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Scan your website to see how AI engines understand, mention, and cite your brand.
            </p>
          </div>
          <Button
            onClick={handleTriggerScan}
            disabled={isTriggeringScan}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs gap-1.5"
          >
            {isTriggeringScan ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Starting Scan...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start My First Scan</span>
              </>
            )}
          </Button>
        </div>
      )}

      <VisibilityTrendChart mentionHistory={overviewData.visibility.mentionHistory} />
      <AIPlatformBreakdownWidget platforms={overviewData.visibility.platformBreakdown} />
      <CompetitorBenchmarkingWidget competitors={overviewData.competitors} />
      <RecommendationsSummaryWidget recommendations={overviewData.recommendations} />
      <WebsiteHealthWidget health={overviewData.websiteHealth} />
      <RecentActivityWidget recentActivity={overviewData.recentActivity} />
    </div>
  );
}
