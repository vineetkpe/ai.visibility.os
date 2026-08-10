'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ScanDetailsData } from './actions';
import type { Recommendation, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { updateRecommendationStatusAction } from '@/app/(dashboard)/recommendations/actions';
import { Button } from '@/components/ui/button';
import { cancelJobAction } from '@/app/(dashboard)/dashboard/actions';
import {
  Scan,
  Clock,
  Sparkles,
  Lightbulb,
  Building,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ExternalLink,
  Code,
  Globe,
  Tag,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanDetailsClientViewProps {
  data: ScanDetailsData;
}

export function ScanDetailsClientView({ data }: ScanDetailsClientViewProps) {
  const {
    scan,
    recommendations: initialRecs,
    aiVisibility,
    competitorAnalysis,
    websiteDiscovery,
    evidence,
  } = data;

  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecs);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Expandable Evidence Section Controls
  const [isRawResponseExpanded, setIsRawResponseExpanded] = useState(false);
  const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
  const [isSourcePagesExpanded, setIsSourcePagesExpanded] = useState(false);
  const [isCancellingScan, setIsCancellingScan] = useState(false);

  const handleCancelScan = async () => {
    try {
      setIsCancellingScan(true);
      const res = await cancelJobAction(scan.id);
      if (res.success) {
        toast.success(
          res.data?.alreadyFinished ? 'Scan already finished.' : 'Scan cancellation requested.'
        );
        window.location.reload();
      } else {
        toast.error(res.error || 'Failed to cancel scan.');
      }
    } catch {
      toast.error('An error occurred while cancelling scan.');
    } finally {
      setIsCancellingScan(false);
    }
  };

  // Recommendation status update handler
  const handleUpdateStatus = async (recId: string, newStatus: RecommendationStatus) => {
    setUpdatingId(recId);
    try {
      const res = await updateRecommendationStatusAction({
        projectId: scan.projectId,
        recommendationId: recId,
        status: newStatus,
      });

      if (res.success) {
        toast.success(`Recommendation updated to ${newStatus.replace('_', ' ')}.`);
        setRecommendations((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
        );
      } else {
        toast.error(res.error || 'Failed to update status.');
      }
    } catch {
      toast.error('An error occurred while updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter recommendations by category
  const filteredRecs = recommendations.filter((r) => {
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-900 gap-1.5"
        >
          <Link href="/dashboard/scans">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scan History</span>
          </Link>
        </Button>
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 1: SCAN SUMMARY
          ------------------------------------------------------------------------- */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Scan className="w-4 h-4" />
              <span>Prompt Evaluation Deliverable</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              &quot;{scan.queryPrompt}&quot;
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono pt-1">
              <span>Engine: {scan.aiModel}</span>
              <span>•</span>
              <span suppressHydrationWarning>Executed: {new Date(scan.createdAt).toLocaleString()}</span>
              {scan.durationSeconds !== null && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Runtime: {scan.durationSeconds}s
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visibility Score Pill */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center gap-4 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Visibility Score
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                {scan.visibilityScore !== null ? `${scan.visibilityScore}/100` : 'N/A'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                scan.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : scan.status === 'failed'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {scan.status}
            </span>

            {(scan.status === 'pending' || scan.status === 'running') && (
              <Button
                variant="outline"
                size="sm"
                disabled={isCancellingScan}
                onClick={handleCancelScan}
                className="bg-red-950/40 text-red-400 border-red-800 hover:bg-red-900/60 hover:text-red-300 text-xs shrink-0"
              >
                {isCancellingScan ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                )}
                Cancel Scan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 2: RECOMMENDATIONS (ACTIONABLE PAYOFF)
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Recommended Optimization Tasks</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tasks generated specifically for this scan prompt or linked evidence (
              {recommendations.length} total)
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none capitalize"
            >
              <option value="all">All Categories</option>
              <option value="citation_opportunity">Citation Opportunity</option>
              <option value="schema">Schema</option>
              <option value="content">Content</option>
              <option value="metadata">Metadata</option>
              <option value="technical_seo">Technical SEO</option>
              <option value="entity_optimization">Entity Optimization</option>
              <option value="ai_visibility">AI Visibility</option>
            </select>
          </div>
        </div>

        {filteredRecs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center text-xs text-slate-500">
            No recommendations linked to this scan match the selected category filter.
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 3: AI VISIBILITY (WHAT THE LLM SAID)
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI Model Response Analysis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Verbatim mention details and citation sources extracted during prompt analysis
          </p>
        </div>

        {/* Gemini Response Summary */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Google Gemini Synthesis Summary
          </h3>
          <p className="text-xs text-slate-800 leading-relaxed font-sans">
            {scan.summary || 'No summary generated for this scan.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entity Mentions Summary */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Detected Entity Mentions ({aiVisibility.mentionSummary.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiVisibility.mentionSummary.length > 0 ? (
                aiVisibility.mentionSummary.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.entityName}</span>
                      <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {m.sentiment}
                      </span>
                    </div>
                    {m.snippet && (
                      <p className="text-[11px] text-slate-600 italic leading-snug">
                        &quot;{m.snippet}&quot;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">
                  No entity mentions detected for this scan prompt.
                </div>
              )}
            </div>
          </div>

          {/* Citations Summary */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Citations Summary ({aiVisibility.citationSummary.totalCount})
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Own Domain Citations</div>
                <div className="text-lg font-bold text-emerald-600">
                  {aiVisibility.citationSummary.ownCount}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">External Citations</div>
                <div className="text-lg font-bold text-blue-600">
                  {aiVisibility.citationSummary.externalCount}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Top Source Domains:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aiVisibility.citationSummary.topDomains.map((dom, idx) => (
                  <span
                    key={idx}
                    className="bg-white px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px] text-slate-700"
                  >
                    {dom}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Provider Breakdown Grid */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            AI Provider Availability
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiVisibility.platformBreakdown.map((p) => (
              <div
                key={p.provider}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                  p.isAvailable
                    ? 'bg-amber-500/5 border-amber-500/30 text-slate-900'
                    : 'bg-slate-50/80 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.displayName}</span>
                  {p.isAvailable ? (
                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full">
                      Executed
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
                {p.isAvailable ? (
                  <div className="text-base font-bold text-slate-900">{p.score}/100</div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Not yet available for this provider
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 4: COMPETITOR ANALYSIS (TIER 1 VS TIER 2 SPLIT)
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-700" />
              <span>Competitor Analysis</span>
            </h2>
            <p className="text-xs text-slate-500">
              Distinguishing scan-level competitor performance from domain profile benchmarks
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="text-xs gap-1">
            <Link href="/competitors">
              <span>View All Competitors</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TIER 1: In This Scan (Scan-Specific) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                In This Scan (Tier 1 Scan-Specific)
              </h3>
              <span className="text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded">
                Prompt Grounded
              </span>
            </div>

            {competitorAnalysis.tier1ScanCompetitors.length > 0 ? (
              <div className="space-y-2">
                {competitorAnalysis.tier1ScanCompetitors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.domainName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">
                        {c.visibilityScore !== null ? `${c.visibilityScore}/100` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.mentionCount} mention(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-white p-4 rounded-lg text-center border border-slate-200">
                No competitor mentions detected in this specific scan response.
              </div>
            )}
          </div>

          {/* TIER 2: Competitor Profile (Domain-Level, Not Scan-Specific) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Tracked Competitor Profiles (Tier 2 Domain-Level)
              </h3>
              <span className="text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded">
                Domain Benchmark
              </span>
            </div>

            {competitorAnalysis.tier2Profiles.length > 0 ? (
              <div className="space-y-2">
                {competitorAnalysis.tier2Profiles.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.domainName}</div>
                    </div>
                    {c.tier2Crawled ? (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Tier 2 Crawled
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        not crawled yet
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-white p-4 rounded-lg text-center border border-slate-200">
                No domain-level competitors tracked for this project.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 5: WEBSITE DISCOVERY
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Website Discovery & Crawl Coverage</span>
          </h2>
          <p className="text-xs text-slate-500">
            Source domain readiness, sitemap indexing, and robots.txt constraints
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs text-slate-500">Pages Crawled</div>
            <div className="text-2xl font-bold text-slate-900">{websiteDiscovery.totalPages}</div>
            <div className="text-[11px] text-slate-400">Indexed for context synthesis</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs text-slate-500">Schema.org Coverage</div>
            <div className="text-2xl font-bold text-amber-600">
              {websiteDiscovery.schemaCoveragePct}%
            </div>
            <div className="text-[11px] text-slate-400">JSON-LD structured data</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs text-slate-500">Metadata Completeness</div>
            <div className="text-2xl font-bold text-blue-600">
              {websiteDiscovery.metadataCoveragePct}%
            </div>
            <div className="text-[11px] text-slate-400">Title & description filled</div>
          </div>

          {/* Robots & Sitemap Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="text-slate-500 font-medium">Robots & Sitemap</div>
            {websiteDiscovery.sitemapUrl !== null ? (
              <div className="space-y-0.5 pt-1">
                <div
                  className="text-[11px] font-mono text-slate-800 truncate"
                  title={websiteDiscovery.sitemapUrl}
                >
                  Sitemap: {websiteDiscovery.sitemapUrl}
                </div>
                <div className="text-[11px] text-slate-500">
                  {websiteDiscovery.sitemapUrlsFound} URL(s) found •{' '}
                  {websiteDiscovery.pagesSkippedRobots} skipped
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic pt-1">Not available for this scan</div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          NARRATIVE SECTION 6: EVIDENCE & PROOF (POSITIONED LAST AS SUPPORTING DETAILS)
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <span>Underlying Evidence & Verbatim Proof</span>
          </h2>
          <p className="text-xs text-slate-500">
            Expandable source pages, full citation lists, and raw AI response text
          </p>
        </div>

        {/* 1. Expandable Source Pages */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsSourcePagesExpanded((prev) => !prev)}
            aria-expanded={isSourcePagesExpanded}
            aria-controls="source-pages-sec"
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-600" />
              <span>Source Pages Matched ({evidence.sourcePages.length})</span>
            </span>
            {isSourcePagesExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {isSourcePagesExpanded && (
            <div id="source-pages-sec" className="p-4 space-y-2 bg-white text-xs">
              {evidence.sourcePages.length > 0 ? (
                evidence.sourcePages.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={sp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-cyan-700 hover:underline truncate max-w-lg"
                      >
                        {sp.url}
                      </a>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        HTTP {sp.httpStatus}
                      </span>
                    </div>
                    {sp.title && (
                      <p className="text-slate-600 text-[11px] font-medium">{sp.title}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">
                  No source pages directly matched to this scan prompt.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Expandable Full Citations Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsCitationsExpanded((prev) => !prev)}
            aria-expanded={isCitationsExpanded}
            aria-controls="citations-sec"
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>Full Citations List ({evidence.citations.length})</span>
            </span>
            {isCitationsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {isCitationsExpanded && (
            <div id="citations-sec" className="p-4 bg-white text-xs overflow-x-auto">
              {evidence.citations.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Domain</th>
                      <th className="p-2">URL</th>
                      <th className="p-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evidence.citations.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 font-mono text-slate-400">#{c.citationOrder}</td>
                        <td className="p-2 font-mono text-slate-800">{c.sourceDomain}</td>
                        <td className="p-2 font-mono text-cyan-700 truncate max-w-xs">
                          {c.sourceUrl}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              c.isOwnDomain
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.isOwnDomain ? 'Own Domain' : 'External'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-slate-400 italic">No citations recorded for this scan.</div>
              )}
            </div>
          )}
        </div>

        {/* 3. Expandable Raw AI Response */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsRawResponseExpanded((prev) => !prev)}
            aria-expanded={isRawResponseExpanded}
            aria-controls="raw-response-sec"
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span className="flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-600" />
              <span>Verbatim Raw AI Response</span>
            </span>
            {isRawResponseExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {isRawResponseExpanded && (
            <div
              id="raw-response-sec"
              className="p-4 bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed border-t border-slate-800"
            >
              {evidence.rawResponse && evidence.rawResponse.trim().length > 0
                ? evidence.rawResponse
                : 'Not available for this scan'}
            </div>
          )}
        </div>
      </div>

      {/* Recommendation Details Modal */}
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
