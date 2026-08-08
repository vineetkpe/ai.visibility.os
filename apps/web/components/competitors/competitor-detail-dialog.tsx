'use client';

import React, { useState, useEffect } from 'react';
import type { CompetitorProfile, Tier2ComparisonMetrics } from '@ai-visibility-os/competitor';
import {
  getCompetitorDetailsAction,
  triggerCompetitorCrawlAction,
} from '@/app/(dashboard)/competitors/actions';
import { Button } from '@/components/ui/button';
import {
  Building,
  Globe,
  Calendar,
  Play,
  AlertCircle,
  Tag,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompetitorDetailDialogProps {
  projectId: string;
  competitorId: string | null;
  onClose: () => void;
}

export function CompetitorDetailDialog({
  projectId,
  competitorId,
  onClose,
}: CompetitorDetailDialogProps) {
  const [profile, setProfile] = useState<CompetitorProfile | null>(null);
  const [tier2Metrics, setTier2Metrics] = useState<Tier2ComparisonMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [activeTab, setActiveTab] = useState<'tier1' | 'tier2'>('tier1');

  useEffect(() => {
    if (!competitorId) return;

    async function loadDetails() {
      setIsLoading(true);
      const res = await getCompetitorDetailsAction({ projectId, competitorId: competitorId! });
      setIsLoading(false);

      if (res.success && res.data) {
        setProfile(res.data.profile);
        setTier2Metrics(res.data.tier2Metrics);
      } else {
        toast.error(res.error || 'Failed to load competitor details.');
      }
    }

    loadDetails();
  }, [projectId, competitorId]);

  if (!competitorId) return null;

  const handleCrawlCompetitor = async () => {
    if (!profile) return;
    setIsCrawling(true);

    const res = await triggerCompetitorCrawlAction({
      projectId,
      competitorId: profile.id,
    });

    setIsCrawling(false);

    if (res.success) {
      toast.success(`Crawl triggered for competitor '${profile.companyName}'!`);
      // Reload profile
      const reloadRes = await getCompetitorDetailsAction({ projectId, competitorId: profile.id });
      if (reloadRes.success && reloadRes.data) {
        setProfile(reloadRes.data.profile);
        setTier2Metrics(reloadRes.data.tier2Metrics);
      }
    } else {
      toast.error(res.error || 'Failed to trigger competitor crawl.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-detail-title"
    >
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
        {isLoading || !profile ? (
          <div
            className="flex flex-col items-center justify-center py-16 space-y-3"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            <p className="text-sm font-medium text-slate-500">
              Loading competitor evidence & metrics...
            </p>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 id="comp-detail-title" className="text-xl font-bold text-slate-900">
                      {profile.companyName}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-700">
                      {profile.domain}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        First Seen:{' '}
                        {new Date(profile.firstSeen || profile.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span>•</span>
                    <span>Source: {profile.detectedFrom}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Overview Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Derived Visibility Score</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {profile.visibilityScore !== null ? `${profile.visibilityScore}%` : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">From latest scan result</div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">Matching AI Citations</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {profile.citationCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tracked domain citations</div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="text-xs font-medium text-slate-500">
                  Website Crawl Status (Tier 2)
                </div>
                <div className="flex items-center space-x-1.5 mt-1">
                  {profile.tier2Available ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Crawled
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="mr-1 h-3.5 w-3.5" /> Uncrawled
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {profile.tier2Available
                    ? `${profile.importantPages?.length || 0} pages indexed`
                    : 'Tier 2 metrics locked'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('tier1')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tier1'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Tier 1: Citations & AI Mentions
              </button>
              <button
                onClick={() => setActiveTab('tier2')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tier2'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Tier 2: Content Comparison
              </button>
            </div>

            {/* Tab 1 Content: Tier 1 Always Available */}
            {activeTab === 'tier1' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-500" />
                    Frequently Cited Pages
                  </h4>
                  {profile.frequentlyCitedPages.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      No direct domain citations found for this competitor across existing AI scans.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {profile.frequentlyCitedPages.map((page, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs"
                        >
                          <span className="font-mono text-slate-700 truncate max-w-md">
                            {page.sourceUrl}
                          </span>
                          <span className="font-semibold text-slate-900 shrink-0">
                            {page.count} {page.count === 1 ? 'citation' : 'citations'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {profile.entities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-slate-500" />
                      Co-Occurring Entities
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.entities.map((ent, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 font-medium"
                        >
                          {ent.name}{' '}
                          <span className="ml-1 text-[10px] text-slate-400">({ent.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2 Content: Tier 2 Content Comparison */}
            {activeTab === 'tier2' && tier2Metrics && (
              <div className="space-y-4">
                {!profile.tier2Available ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center space-y-3">
                    <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
                    <div>
                      <h4 className="text-base font-semibold text-amber-900">
                        Tier 2 Content Comparison Unavailable
                      </h4>
                      <p className="text-xs text-amber-700 max-w-md mx-auto mt-1">
                        {tier2Metrics.sharedTopics.available === false
                          ? tier2Metrics.sharedTopics.reason
                          : 'This competitor domain has not been crawled yet. Trigger a crawl to unlock real content comparison, missing topics, and schema coverage.'}
                      </p>
                    </div>

                    <Button
                      onClick={handleCrawlCompetitor}
                      disabled={isCrawling}
                      size="sm"
                      className="bg-amber-900 text-white hover:bg-amber-800 gap-1.5"
                    >
                      {isCrawling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Crawling Domain...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Crawl This Competitor
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Content Overlap Percentage */}
                    {tier2Metrics.contentOverlap.available && (
                      <div className="rounded-lg bg-slate-900 p-4 text-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium">
                            Content Overlap Score
                          </span>
                          <span className="text-lg font-bold text-emerald-400">
                            {tier2Metrics.contentOverlap.data.scorePercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-300"
                            style={{
                              width: `${tier2Metrics.contentOverlap.data.scorePercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Shared Topics & Missing Topics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-slate-200 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                          <span>Shared Topics</span>
                          <span className="text-emerald-600 font-bold">
                            {tier2Metrics.sharedTopics.available
                              ? tier2Metrics.sharedTopics.data.count
                              : 0}
                          </span>
                        </div>
                        {tier2Metrics.sharedTopics.available &&
                        tier2Metrics.sharedTopics.data.topics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tier2Metrics.sharedTopics.data.topics.map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] border border-emerald-200/60 font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            No shared topics detected.
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                          <span>Missing Topics in Your Context</span>
                          <span className="text-amber-600 font-bold">
                            {tier2Metrics.missingTopics.available
                              ? tier2Metrics.missingTopics.data.count
                              : 0}
                          </span>
                        </div>
                        {tier2Metrics.missingTopics.available &&
                        tier2Metrics.missingTopics.data.topics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tier2Metrics.missingTopics.data.topics.map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] border border-amber-200/60 font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            No missing topics detected.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schema Coverage */}
                    {tier2Metrics.schemaCoverage.available && (
                      <div className="rounded-lg border border-slate-200 p-3.5 space-y-2">
                        <h5 className="text-xs font-semibold text-slate-900">
                          Schema.org Types Comparison
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">User Domain Schemas:</span>
                            <p className="font-mono text-slate-800 mt-0.5">
                              {tier2Metrics.schemaCoverage.data.userSchemas.join(', ') ||
                                'None detected'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">Competitor Schemas:</span>
                            <p className="font-mono text-slate-800 mt-0.5">
                              {tier2Metrics.schemaCoverage.data.competitorSchemas.join(', ') ||
                                'None detected'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close Profile
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
