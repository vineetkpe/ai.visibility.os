'use client';

import React, { useState } from 'react';
import type { Recommendation, RecommendationPriority, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { generateRecommendationsAction, getRecommendationsOverviewAction, updateRecommendationStatusAction } from './actions';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles, RefreshCw, AlertTriangle, Zap, CheckCircle2, Filter, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationsClientViewProps { projectId: string; initialRecommendations: Recommendation[]; }

function PriorityTag({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const cls =
    p === 'critical'
      ? 'bg-red-50 text-red-700 border-red-200'
      : p === 'high'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${cls}`}>
      {priority}
    </span>
  );
}

export function RecommendationsClientView({ projectId, initialRecommendations }: RecommendationsClientViewProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const refreshRecommendations = async () => {
    const filterObj: { status?: RecommendationStatus; category?: string; priority?: RecommendationPriority } = {};
    if (selectedStatus !== 'all') filterObj.status = selectedStatus as RecommendationStatus;
    if (selectedCategory !== 'all') filterObj.category = selectedCategory;
    if (selectedPriority !== 'all') filterObj.priority = selectedPriority as RecommendationPriority;
    const res = await getRecommendationsOverviewAction(projectId, filterObj);
    if (res.success && res.data) setRecommendations(res.data);
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      toast.info('Reviewing your latest evidence...');
      const res = await generateRecommendationsAction(projectId);
      if (!res.success) toast.error(res.error || 'Unable to generate recommendations.');
      else if (res.data) {
        toast.success(`${res.data.createdCount} new opportunities found.`);
        await refreshRecommendations();
      }
    } catch {
      toast.error('Something went wrong while generating recommendations.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (recId: string, newStatus: RecommendationStatus) => {
    setUpdatingId(recId);
    try {
      const res = await updateRecommendationStatusAction({ projectId, recommendationId: recId, status: newStatus });
      if (res.success) {
        toast.success(`Marked ${newStatus.replace('_', ' ')}.`);
        await refreshRecommendations();
      } else toast.error(res.error || 'Unable to update recommendation.');
    } catch {
      toast.error('Unable to update recommendation.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRecs = recommendations.filter(
    (r) =>
      (selectedStatus === 'all' || r.status === selectedStatus) &&
      (selectedCategory === 'all' || r.category === selectedCategory) &&
      (selectedPriority === 'all' || r.priority === selectedPriority)
  );

  const totalCount = recommendations.length;
  const criticalCount = recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').length;
  const quickWinCount = recommendations.filter((r) => r.effortScore <= 2).length;
  const resolvedCount = recommendations.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span>REMEDIATION WORKSPACE</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Prioritized Action Playbooks
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Data-backed optimization blueprints derived from ground-truth LLM response analysis.
          </p>
        </div>
        <Button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="gap-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold border border-amber-600/30 text-xs px-3.5 h-8 shadow-2xs shrink-0"
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />}
          <span>{isGenerating ? 'Evaluating Data...' : 'Analyze Evidence'}</span>
        </Button>
      </div>

      {/* Metric Strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">OPEN OPPORTUNITIES</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{totalCount - resolvedCount}</div>
        </div>
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">HIGH IMPACT TASKS</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-700">{criticalCount}</div>
        </div>
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">QUICK WINS</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">{quickWinCount}</div>
        </div>
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500">RESOLVED BLUEPRINTS</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-700">{resolvedCount}</div>
        </div>
      </div>

      {/* Main Table & Filters */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-[#e2e4e9] p-3 lg:flex-row lg:items-center lg:justify-between bg-[#faf9f6]">
          <div className="flex items-center gap-1 overflow-x-auto">
            {['open', 'in_progress', 'resolved', 'dismissed', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                  selectedStatus === st ? 'bg-slate-950 text-white font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {st.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded border border-[#e2e4e9] bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="citation_opportunity">Citation Opportunity</option>
              <option value="schema">Schema Markup</option>
              <option value="content">Content Gap</option>
              <option value="metadata">Metadata</option>
              <option value="technical_seo">Technical GEO</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded border border-[#e2e4e9] bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRecommendations}
              className="text-slate-600 hover:text-slate-950 h-7 px-2"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Data Table View */}
        {filteredRecs.length ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e4e9] bg-[#faf9f6] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Action Title</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Score Impact</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e4e9]">
                  {filteredRecs.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRec(rec)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <PriorityTag priority={rec.priority} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-950 max-w-md">
                        <div className="truncate">{rec.title}</div>
                        <div className="text-[11px] font-normal text-slate-500 line-clamp-1">{rec.description}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{rec.category}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        +{rec.impactScore * 2.5} Lift
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRec(rec)}
                          className="h-7 text-[11px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                        >
                          Blueprint
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked List */}
            <div className="md:hidden divide-y divide-[#e2e4e9]">
              {filteredRecs.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRec(rec)}
                  className="p-4 hover:bg-slate-50/80 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <PriorityTag priority={rec.priority} />
                    <span className="font-mono font-bold text-emerald-600 text-xs">+{rec.impactScore * 2.5} Lift</span>
                  </div>
                  <div className="font-bold text-slate-950 text-xs">{rec.title}</div>
                  <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-100">
                    <span>{rec.category}</span>
                    <span className="font-semibold text-amber-700">Open Blueprint →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <Lightbulb className="mx-auto h-6 w-6 text-slate-300 mb-2" />
            <div className="font-bold text-slate-900">No action items matching filter criteria</div>
            <p className="mt-1 text-slate-500">Adjust your category or status filter to see recommendations.</p>
          </div>
        )}
      </div>

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
