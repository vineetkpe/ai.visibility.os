'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompetitorProfile, CompetitorSuggestion } from '@ai-visibility-os/competitor';
import { AddCompetitorModal } from '@/components/competitors/add-competitor-modal';
import { CompetitorSuggestions } from '@/components/competitors/competitor-suggestions';
import { CompetitorDetailDialog } from '@/components/competitors/competitor-detail-dialog';
import { triggerCompetitorCrawlAction } from './actions';
import { Button } from '@/components/ui/button';
import {
  Building,
  Globe,
  TrendingUp,
  BarChart2,
  Eye,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectOption {
  id: string;
  name: string;
}

interface CompetitorsClientViewProps {
  projects: ProjectOption[];
  currentProjectId: string;
  initialCompetitors: CompetitorProfile[];
  initialSuggestions: CompetitorSuggestion[];
}

export function CompetitorsClientView({
  projects,
  currentProjectId,
  initialCompetitors,
  initialSuggestions,
}: CompetitorsClientViewProps) {
  const router = useRouter();
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [crawlingMap, setCrawlingMap] = useState<Record<string, boolean>>({});

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/competitors?projectId=${newId}`);
  };

  const refreshData = () => {
    router.refresh();
  };

  const handleTriggerCrawl = async (competitorId: string, companyName: string) => {
    setCrawlingMap((prev) => ({ ...prev, [competitorId]: true }));

    const res = await triggerCompetitorCrawlAction({
      projectId: currentProjectId,
      competitorId,
    });

    setCrawlingMap((prev) => ({ ...prev, [competitorId]: false }));

    if (res.success) {
      toast.success(`Website discovery crawl triggered for '${companyName}'!`);
      refreshData();
    } else {
      toast.error(res.error || 'Failed to trigger crawl.');
    }
  };

  // KPI Computations
  const totalCompetitors = initialCompetitors.length;
  const scores = initialCompetitors
    .map((c) => c.visibilityScore)
    .filter((s): s is number => s !== null);
  const avgVisibility =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const crawledCount = initialCompetitors.filter((c) => c.tier2Available).length;

  return (
    <div className="space-y-8">
      {/* Header Bar with Project Selector & Add Competitor Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <FolderKanban className="h-5 w-5 text-slate-500" />
          <div className="flex items-center space-x-2">
            <label
              htmlFor="comp-project-select"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Active Project:
            </label>
            <select
              id="comp-project-select"
              value={currentProjectId}
              onChange={handleProjectChange}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AddCompetitorModal projectId={currentProjectId} onCompetitorAdded={refreshData} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tracked Competitors
            </span>
            <Building className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCompetitors}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Explicitly user-confirmed domains</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Visibility Score
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {avgVisibility !== null ? `${avgVisibility}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Derived from latest scan results</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Crawled Sites (Tier 2)
            </span>
            <BarChart2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {crawledCount}{' '}
            <span className="text-xs font-normal text-slate-400">/ {totalCompetitors}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Real content comparison ready</p>
        </div>
      </div>

      {/* Competitor Suggestions Banner */}
      {initialSuggestions.length > 0 && (
        <CompetitorSuggestions
          projectId={currentProjectId}
          suggestions={initialSuggestions}
          onSuggestionConfirmed={refreshData}
        />
      )}

      {/* Tracked Competitors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Tracked Competitors</h3>
          <span className="text-xs text-slate-500">{totalCompetitors} total</span>
        </div>

        {totalCompetitors === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center space-y-3">
            <Building className="mx-auto h-8 w-8 text-slate-400" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">No competitors tracked yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add a competitor domain manually or confirm an AI scan co-occurrence suggestion to
                start benchmarking.
              </p>
            </div>
            <AddCompetitorModal projectId={currentProjectId} onCompetitorAdded={refreshData} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialCompetitors.map((comp) => {
              const isCrawling = crawlingMap[comp.id];

              return (
                <div
                  key={comp.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{comp.companyName}</h4>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{comp.domain}</span>
                        </div>
                      </div>

                      <span className="inline-flex flex-col items-end">
                        <span className="text-lg font-bold text-slate-900">
                          {comp.visibilityScore !== null ? `${comp.visibilityScore}%` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">Visibility</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Citations:</span>
                        <span className="font-semibold text-slate-900">{comp.citationCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tier 2 Crawl:</span>
                        {comp.tier2Available ? (
                          <span className="inline-flex items-center font-medium text-emerald-700 text-[11px]">
                            <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" /> Crawled
                          </span>
                        ) : (
                          <span className="inline-flex items-center font-medium text-amber-700 text-[11px]">
                            <AlertCircle className="mr-1 h-3 w-3 text-amber-500" /> Uncrawled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCompetitorId(comp.id)}
                      className="text-xs text-slate-700 hover:text-slate-900 gap-1 px-2"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Profile
                    </Button>

                    {!comp.tier2Available && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCrawling}
                        onClick={() => handleTriggerCrawl(comp.id, comp.companyName)}
                        className="text-xs gap-1 h-8"
                      >
                        {isCrawling ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Crawling...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 text-amber-600" /> Crawl
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competitor Profile & Evidence Modal */}
      {selectedCompetitorId && (
        <CompetitorDetailDialog
          projectId={currentProjectId}
          competitorId={selectedCompetitorId}
          onClose={() => setSelectedCompetitorId(null)}
        />
      )}
    </div>
  );
}
