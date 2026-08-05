'use client';

import React, { useState } from 'react';
import type {
  Recommendation,
  RecommendationCategory,
  PriorityBand,
  RecommendationStatus,
} from '@ai-visibility-os/recommendations';
import {
  generateRecommendationsAction,
  getRecommendationsOverviewAction,
  updateRecommendationStatusAction,
} from './actions';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Filter,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationsClientViewProps {
  projectId: string;
  initialRecommendations: Recommendation[];
}

export function RecommendationsClientView({
  projectId,
  initialRecommendations,
}: RecommendationsClientViewProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Selected for Details Dialog
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  // Helper to refresh recommendations from server
  const refreshRecommendations = async () => {
    const filterObj: {
      status?: RecommendationStatus;
      category?: RecommendationCategory;
      priority?: PriorityBand;
    } = {};

    if (selectedStatus !== 'all') {
      filterObj.status = selectedStatus as RecommendationStatus;
    }
    if (selectedCategory !== 'all') {
      filterObj.category = selectedCategory as RecommendationCategory;
    }
    if (selectedPriority !== 'all') {
      filterObj.priority = selectedPriority as PriorityBand;
    }

    const res = await getRecommendationsOverviewAction(projectId, filterObj);
    if (res.success && res.data) {
      setRecommendations(res.data);
    }
  };

  // Handle Manual Recommendation Generation
  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      toast.info('Analyzing project evidence and generating recommendations...');
      const res = await generateRecommendationsAction(projectId);
      if (!res.success) {
        toast.error(res.error || 'Failed to generate recommendations.');
      } else if (res.data) {
        const { detectedCount, createdCount, updatedCount, autoResolvedCount } = res.data;
        toast.success(
          `Recommendation Engine completed: ${detectedCount} detected, ${createdCount} created, ${updatedCount} refreshed, ${autoResolvedCount} auto-resolved.`
        );
        await refreshRecommendations();
      }
    } catch {
      toast.error('An unexpected error occurred while generating recommendations.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Status Change
  const handleUpdateStatus = async (recId: string, newStatus: RecommendationStatus) => {
    setUpdatingId(recId);
    try {
      const res = await updateRecommendationStatusAction({
        projectId,
        recommendationId: recId,
        status: newStatus,
      });

      if (res.success) {
        toast.success(`Recommendation status updated to ${newStatus.replace('_', ' ')}.`);
        await refreshRecommendations();
      } else {
        toast.error(res.error || 'Failed to update status.');
      }
    } catch {
      toast.error('An error occurred while updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered List
  const filteredRecs = recommendations.filter((r) => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && r.priority !== selectedPriority) return false;
    return true;
  });

  // Stats calculation
  const totalCount = recommendations.length;
  const criticalCount = recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').length;
  const quickWinCount = recommendations.filter((r) => r.estimatedEffort === 'quick_win').length;
  const resolvedCount = recommendations.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-neutral-900/60 p-6 rounded-xl border border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-amber-400" />
              <span>AI Recommendation Engine</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Evidence Grounded
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            Deterministic optimization recommendations derived from crawl data, business context, scan results, and competitor benchmarks.
          </p>
        </div>

        <Button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-neutral-950 font-semibold shadow-lg shrink-0 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              <span>Analyzing Evidence...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-neutral-950" />
              <span>Generate Recommendations</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-neutral-400">Total Tracked Tasks</div>
            <div className="text-2xl font-bold text-neutral-100">{totalCount}</div>
          </div>
          <FileText className="w-8 h-8 text-neutral-500/40" />
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-neutral-400">Critical / High Priority</div>
            <div className="text-2xl font-bold text-amber-400">{criticalCount}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/30" />
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-neutral-400">Quick Wins</div>
            <div className="text-2xl font-bold text-orange-400">{quickWinCount}</div>
          </div>
          <Zap className="w-8 h-8 text-orange-500/30" />
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-neutral-400">Auto / Resolved Tasks</div>
            <div className="text-2xl font-bold text-emerald-400">{resolvedCount}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs" role="tablist" aria-label="Recommendation status filter">
          {['open', 'in_progress', 'completed', 'dismissed', 'all'].map((st) => (
            <button
              key={st}
              role="tab"
              aria-selected={selectedStatus === st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md transition-colors capitalize whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 ${
                selectedStatus === st
                  ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <label htmlFor="rec-cat-select" className="text-neutral-400">Category:</label>
            <select
              id="rec-cat-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-hidden capitalize"
            >
              <option value="all" className="bg-neutral-900 text-neutral-200">
                All Categories
              </option>
              <option value="citation_opportunity" className="bg-neutral-900 text-neutral-200">
                Citation Opportunity
              </option>
              <option value="schema" className="bg-neutral-900 text-neutral-200">
                Schema
              </option>
              <option value="content" className="bg-neutral-900 text-neutral-200">
                Content
              </option>
              <option value="metadata" className="bg-neutral-900 text-neutral-200">
                Metadata
              </option>
              <option value="technical_seo" className="bg-neutral-900 text-neutral-200">
                Technical SEO
              </option>
              <option value="entity_optimization" className="bg-neutral-900 text-neutral-200">
                Entity Optimization
              </option>
              <option value="internal_linking" className="bg-neutral-900 text-neutral-200">
                Internal Linking
              </option>
              <option value="ai_visibility" className="bg-neutral-900 text-neutral-200">
                AI Visibility
              </option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <label htmlFor="rec-prio-select" className="text-neutral-400">Priority:</label>
            <select
              id="rec-prio-select"
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none capitalize"
            >
              <option value="all" className="bg-neutral-900 text-neutral-200">
                All Priorities
              </option>
              <option value="critical" className="bg-neutral-900 text-neutral-200">
                Critical
              </option>
              <option value="high" className="bg-neutral-900 text-neutral-200">
                High
              </option>
              <option value="medium" className="bg-neutral-900 text-neutral-200">
                Medium
              </option>
              <option value="low" className="bg-neutral-900 text-neutral-200">
                Low
              </option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRecommendations}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRecs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onOpenDetails={(r) => setSelectedRec(r)}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updatingId === rec.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-12 text-center space-y-4">
          <Lightbulb className="w-12 h-12 text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-neutral-200">
              No recommendations match selected filters
            </h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              Run the AI Recommendation Engine to analyze project crawl data, business context, and scan evidence.
            </p>
          </div>
          <Button
            onClick={handleGenerateRecommendations}
            disabled={isGenerating}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Generating...
              </>
            ) : (
              'Run Recommendation Engine'
            )}
          </Button>
        </div>
      )}

      {/* Details Modal Dialog */}
      <RecommendationDetailDialog
        recommendation={selectedRec}
        isOpen={Boolean(selectedRec)}
        onClose={() => setSelectedRec(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updatingId === selectedRec?.id}
      />
    </div>
  );
}
