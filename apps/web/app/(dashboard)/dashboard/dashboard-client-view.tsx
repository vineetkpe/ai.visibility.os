'use client';

import React, { useState } from 'react';
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
import { Play, Loader2, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardClientViewProps {
  projectId: string;
  initialData?: DashboardOverviewData;
}

export function DashboardClientView({ projectId, initialData }: DashboardClientViewProps) {
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);

  // 1. Enable Supabase Realtime live subscriptions (invalidates Query cache on scan/job updates)
  useDashboardRealtime(projectId);

  // 2. Fetch Dashboard Overview Data with TanStack Query
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
    staleTime: 1000 * 30, // 30 seconds
  });

  // Handle Trigger Scan
  const handleTriggerScan = async () => {
    setIsTriggeringScan(true);
    try {
      toast.info('Dispatching AI Visibility Engine scan task...');
      const res = await startVisibilityScanAction(projectId);
      if (res.success) {
        toast.success(
          'Visibility scan task dispatched! Realtime updates will automatically refresh results once completed.'
        );
        refetch();
      } else {
        toast.error(res.error || 'Failed to dispatch visibility scan.');
      }
    } catch {
      toast.error('An unexpected error occurred while starting visibility scan.');
    } finally {
      setIsTriggeringScan(false);
    }
  };

  if (isLoading && !overviewData) {
    return (
      <div className="p-8 space-y-6">
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
        description="Please complete onboarding or create a website project first."
      />
    );
  }

  const hasNoScans = !overviewData.latestScan;

  return (
    <div className="space-y-6">
      {/* Widget 1: Project Overview & Latest Scan Header */}
      <ProjectOverviewWidget
        project={overviewData.project}
        latestScan={overviewData.latestScan}
        onTriggerScan={handleTriggerScan}
        isTriggering={isTriggeringScan}
      />

      {/* Empty State Prompt if no scans run yet */}
      {hasNoScans && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No AI visibility scans executed yet
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Start your first visibility scan to evaluate AI search engine recommendations and prompt citation performance.
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
                <span>Execute First Scan</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Widget 2: AI Visibility Trend Line Chart */}
      <VisibilityTrendChart mentionHistory={overviewData.visibility.mentionHistory} />

      {/* Widget 3: AI Platform Breakdown (Gemini real data + unavailable badges) */}
      <AIPlatformBreakdownWidget platforms={overviewData.visibility.platformBreakdown} />

      {/* Widget 4: Competitor Benchmarks (Bar charts & Tier 2 indicators) */}
      <CompetitorBenchmarkingWidget competitors={overviewData.competitors} />

      {/* Widget 5: Recommendations Overview (Links to /recommendations) */}
      <RecommendationsSummaryWidget recommendations={overviewData.recommendations} />

      {/* Widget 6: Website Health (Pages, Schema %, Metadata %) */}
      <WebsiteHealthWidget health={overviewData.websiteHealth} />

      {/* Widget 7: Recent Activity & System Jobs Log */}
      <RecentActivityWidget recentActivity={overviewData.recentActivity} />
    </div>
  );
}
