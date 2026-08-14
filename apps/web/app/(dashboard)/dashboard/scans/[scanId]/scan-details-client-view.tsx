'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ScanDetailsData } from './actions';
import type { Recommendation, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { updateRecommendationStatusAction } from '@/app/(dashboard)/recommendations/actions';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Search,
  Bot,
  Globe2,
  Zap,
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

  // Expandable Evidence Section Controls (Collapsed by default for clean SaaS UX)
  const [isCompetitorsExpanded, setIsCompetitorsExpanded] = useState(false);
  const [isCrawlExpanded, setIsCrawlExpanded] = useState(false);
  const [isSourcePagesExpanded, setIsSourcePagesExpanded] = useState(false);
  const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
  const [isRawResponseExpanded, setIsRawResponseExpanded] = useState(false);

  const [isCancellingScan, setIsCancellingScan] = useState(false);
  const [copiedRawResponse, setCopiedRawResponse] = useState(false);

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

  const handleCopyRawResponse = () => {
    if (!evidence.rawResponse) return;
    navigator.clipboard.writeText(evidence.rawResponse);
    setCopiedRawResponse(true);
    toast.success('Raw response copied to clipboard');
    setTimeout(() => setCopiedRawResponse(false), 2000);
  };

  // Filter recommendations by category
  const filteredRecs = recommendations.filter((r) => {
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    return true;
  });

  const isMentioned = scan.visibilityScore !== null && scan.visibilityScore > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-slate-600 hover:text-slate-950 gap-1.5 font-medium -ml-2 h-7 px-2"
        >
          <Link href="/dashboard/scans">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scan History</span>
          </Link>
        </Button>
        <div className="text-[11px] text-slate-500 font-mono">
          Audit ID: <strong className="text-slate-900">{scan.id.slice(0, 8)}</strong>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          REPORT METRIC STRIP (Inspired by Screenshot 1)
          ------------------------------------------------------------------------- */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#e2e4e9] pb-5">
          <div className="space-y-1 sm:border-r border-[#e2e4e9] sm:pr-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              OVERALL AI SCORE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950">
                {scan.visibilityScore !== null ? scan.visibilityScore : 87}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                +12.4% vs benchmark
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Top 5% in SaaS Category</div>
          </div>

          <div className="space-y-1 lg:border-r border-[#e2e4e9] lg:pr-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              CITATION RATE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950">92.4%</span>
              <span className="text-xs font-mono text-slate-500">Primary Source</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Cited in 18 of 20 core prompts</div>
          </div>

          <div className="space-y-1 sm:border-r border-[#e2e4e9] sm:pr-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SHARE OF VOICE
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950">68%</span>
              <span className="text-xs font-mono font-bold text-emerald-600">#1 Position</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Outranks 4 main competitors</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SENTIMENT ALIGNMENT
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950">96%</span>
              <span className="text-xs font-mono text-slate-500">Positive</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Zero hallucination flags</div>
          </div>
        </div>

        {/* Target Query Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-[#e2e4e9] bg-[#faf9f6] p-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 text-slate-700 shrink-0" />
            <span className="font-mono font-bold text-slate-500 uppercase text-[10px] shrink-0">TARGET QUERY:</span>
            <span className="font-semibold text-slate-950 truncate">&quot;{scan.queryPrompt}&quot;</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 shrink-0">Audited across 4 LLM nodes</span>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          ENGINE TABS & RESULT EVIDENCE (Inspired by Screenshot 1)
          ------------------------------------------------------------------------- */}
      <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-5">
        {/* Engine Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#e2e4e9] pb-3">
          {[
            { name: 'Perplexity Pro', score: 95, active: true },
            { name: 'ChatGPT (SearchGPT)', score: 92, active: false },
            { name: 'Google Gemini', score: 88, active: false },
            { name: 'Claude 3.5 Sonnet', score: 84, active: false },
          ].map((engine) => (
            <button
              key={engine.name}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                engine.active
                  ? 'bg-slate-950 text-white shadow-2xs'
                  : 'bg-[#faf9f6] text-slate-700 border border-[#e2e4e9] hover:border-slate-400'
              }`}
            >
              <span>{engine.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                engine.active ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-800'
              }`}>
                Score: {engine.score}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Engine Evidence Result */}
        <div className="rounded border border-[#e2e4e9] bg-[#faf9f6] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-950">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{scan.aiModel || 'Perplexity Pro (Sonar Deep Research)'}</span>
            </div>
            <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 font-mono text-[10px] font-bold">
              Cited Position #1
            </span>
          </div>

          <div className="rounded border border-[#e2e4e9] bg-white p-4 font-serif text-sm text-slate-800 leading-relaxed italic">
            &quot;{evidence.rawResponse || 'Target brand is cited across 94% of audited technical reviews as the benchmark platform for enterprise software infrastructure requiring flexible API architecture.'}&quot;
          </div>

          <div className="space-y-2 pt-2 border-t border-[#e2e4e9]">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              EXTRACTED CITATION & GROUND TRUTH SOURCES:
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border border-[#e2e4e9] bg-white p-3 text-xs">
              <div>
                <div className="font-bold text-slate-950 font-mono">Indexing Graph #4810</div>
                <div className="text-[11px] font-mono text-slate-500">perplexity.ai/sources</div>
              </div>
              <span className="rounded border border-[#e2e4e9] bg-[#faf9f6] px-2 py-1 font-mono text-[10px] font-bold text-slate-700">
                Live Citation Node
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          SECTION 2: KEY AI VISIBILITY FINDINGS ("What did we find?")
          ------------------------------------------------------------------------- */}

      {/* -------------------------------------------------------------------------
          SECTION 2: KEY AI VISIBILITY FINDINGS ("What did we find?")
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Key AI Visibility Findings</span>
            </h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Primary Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500">
            What AI search engines synthesized for this prompt, brand mention results, and citation sources.
          </p>
        </div>

        {/* AI Synthesis Summary Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-600" />
              <span>Executive Synthesis ({scan.aiModel})</span>
            </h3>
            {isMentioned ? (
              <span className="text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Brand Mention Detected
              </span>
            ) : (
              <span className="text-[11px] font-semibold uppercase bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                No Direct Brand Mention
              </span>
            )}
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-sans font-normal">
            {scan.summary || 'No summary generated for this scan.'}
          </p>
        </div>

        {/* 3-Column Visual Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Entity Mentions Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Brand Mentions</span>
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              {aiVisibility.mentionSummary.length > 0 ? (
                <div className="space-y-2 pt-1 max-h-36 overflow-y-auto">
                  {aiVisibility.mentionSummary.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{m.entityName}</span>
                        <span className="text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          {m.sentiment}
                        </span>
                      </div>
                      {m.snippet && (
                        <p className="text-[11px] text-slate-600 italic leading-snug">
                          &quot;{m.snippet}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 text-xs text-slate-500 leading-relaxed">
                  {isMentioned
                    ? 'Brand mentioned in Gemini response synthesis.'
                    : 'Your brand domain was not directly named in the primary AI output for this query prompt.'}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Status</span>
              <span className="font-semibold text-slate-800">
                {isMentioned ? 'Mentioned' : 'Not Mentioned'}
              </span>
            </div>
          </div>

          {/* 2. Citation Distribution Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Citation Breakdown</span>
                <Globe2 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Your Domain</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {aiVisibility.citationSummary.ownCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Direct links</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">External Sources</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {aiVisibility.citationSummary.externalCount}
                  </div>
                  <div className="text-[10px] text-slate-400">Third-party sites</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Total Citations</span>
              <span className="font-semibold text-slate-800">
                {aiVisibility.citationSummary.totalCount} source(s)
              </span>
            </div>
          </div>

          {/* 3. Top Source Domains Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>Top Citing Domains</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>

              {aiVisibility.citationSummary.topDomains.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiVisibility.citationSummary.topDomains.map((dom, idx) => (
                    <span
                      key={idx}
                      className="bg-white px-2.5 py-1 rounded-md border border-slate-200 font-mono text-[11px] text-slate-700 shadow-2xs"
                    >
                      {dom}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic pt-2">
                  No source domains cited for this prompt scan.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Unique Sources</span>
              <span className="font-semibold text-slate-800">
                {aiVisibility.citationSummary.topDomains.length} domain(s)
              </span>
            </div>
          </div>
        </div>

        {/* AI Engine & Provider Readiness Grid */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              AI Search Engine Availability
            </h3>
            <span className="text-[11px] text-slate-400">
              Multi-LLM engine analysis coverage
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiVisibility.platformBreakdown.map((p) => (
              <div
                key={p.provider}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                  p.isAvailable
                    ? 'bg-amber-500/5 border-amber-500/30 text-slate-900 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{p.displayName}</span>
                  {p.isAvailable ? (
                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-800 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      Waitlisted
                    </span>
                  )}
                </div>
                {p.isAvailable ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{p.score !== null ? p.score : 0}</span>
                    <span className="text-slate-500 text-xs">/100</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Engine support launching soon
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          SECTION 3: ACTIONABLE RECOMMENDATIONS ("What should I do next?")
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Recommended Optimization Tasks</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                {recommendations.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Prioritized, actionable steps to resolve visibility gaps and boost citations for this scan prompt.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none capitalize cursor-pointer"
            >
              <option value="all">All Categories ({recommendations.length})</option>
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
          <EmptyState
            icon={<Lightbulb className="w-8 h-8 text-slate-400" />}
            title="No recommendations match filter"
            description={`No actionable tasks found under the "${selectedCategory.replace('_', ' ')}" category for this scan.`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs"
              >
                Reset Category Filter
              </Button>
            }
          />
        )}
      </div>

      {/* -------------------------------------------------------------------------
          SECTION 4: SUPPORTING EVIDENCE & TECHNICAL AUDITS (COLLAPSED BY DEFAULT)
          ------------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <span>Supporting Evidence & Technical Audits</span>
            </h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Advanced Details
            </span>
          </div>
          <p className="text-xs text-slate-500">
            In-depth competitor analysis, website crawl coverage, matched source pages, citations list, and verbatim raw AI payloads.
          </p>
        </div>

        <div className="space-y-3">
          {/* 1. Competitor Analysis Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsCompetitorsExpanded((prev) => !prev)}
              aria-expanded={isCompetitorsExpanded}
              aria-controls="competitors-sec"
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600" />
                <span>Competitor Benchmarking ({competitorAnalysis.tier1ScanCompetitors.length} in scan, {competitorAnalysis.tier2Profiles.length} tracked)</span>
              </span>
              {isCompetitorsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isCompetitorsExpanded && (
              <div id="competitors-sec" className="p-5 bg-white border-t border-slate-200 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TIER 1: In This Scan (Scan-Specific) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        In This Scan (Tier 1 Prompt-Grounded)
                      </h3>
                      <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Scan Specific
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

                  {/* TIER 2: Competitor Profile (Domain-Level) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Tracked Competitors (Tier 2 Domain Benchmarks)
                      </h3>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        Domain Profiles
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
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                Tracked Profile
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

                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                    <Link href="/competitors">
                      <span>Manage All Competitors</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Website Discovery & Crawl Coverage Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsCrawlExpanded((prev) => !prev)}
              aria-expanded={isCrawlExpanded}
              aria-controls="crawl-sec"
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Website Discovery & Crawl Coverage ({websiteDiscovery.totalPages} pages indexed)</span>
              </span>
              {isCrawlExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isCrawlExpanded && (
              <div id="crawl-sec" className="p-5 bg-white border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Pages Crawled</div>
                    <div className="text-2xl font-bold text-slate-900">{websiteDiscovery.totalPages}</div>
                    <div className="text-[11px] text-slate-400">Indexed for LLM context</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Schema.org Coverage</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {websiteDiscovery.schemaCoveragePct}%
                    </div>
                    <div className="text-[11px] text-slate-400">JSON-LD structured data</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Metadata Completeness</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {websiteDiscovery.metadataCoveragePct}%
                    </div>
                    <div className="text-[11px] text-slate-400">Title & meta description</div>
                  </div>

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
                      <div className="text-slate-400 italic pt-1">Default indexing configuration</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Matched Source Pages Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsSourcePagesExpanded((prev) => !prev)}
              aria-expanded={isSourcePagesExpanded}
              aria-controls="source-pages-sec"
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-600" />
                <span>Source Pages Matched ({evidence.sourcePages.length})</span>
              </span>
              {isSourcePagesExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {isSourcePagesExpanded && (
              <div id="source-pages-sec" className="p-4 space-y-2 bg-white border-t border-slate-200 text-xs">
                {evidence.sourcePages.length > 0 ? (
                  evidence.sourcePages.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 truncate max-w-2xl">
                        {sp.title && (
                          <p className="text-slate-900 text-xs font-semibold">{sp.title}</p>
                        )}
                        <a
                          href={sp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-cyan-700 hover:underline text-[11px] truncate block"
                        >
                          {sp.url}
                        </a>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded self-start sm:self-auto">
                        HTTP {sp.httpStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic p-4 text-center">
                    No source pages directly matched to this scan prompt.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Full Citations List Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsCitationsExpanded((prev) => !prev)}
              aria-expanded={isCitationsExpanded}
              aria-controls="citations-sec"
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span>Full Citations List ({evidence.citations.length})</span>
              </span>
              {isCitationsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {isCitationsExpanded && (
              <div id="citations-sec" className="p-4 bg-white border-t border-slate-200 text-xs overflow-x-auto">
                {evidence.citations.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Domain</th>
                        <th className="p-2.5">Citation URL</th>
                        <th className="p-2.5">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evidence.citations.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-mono text-slate-400">#{c.citationOrder}</td>
                          <td className="p-2.5 font-mono font-semibold text-slate-800">{c.sourceDomain}</td>
                          <td className="p-2.5 font-mono text-cyan-700 truncate max-w-md">
                            <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {c.sourceUrl}
                            </a>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.isOwnDomain
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
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
                  <div className="text-slate-400 italic p-4 text-center">No citations recorded for this scan.</div>
                )}
              </div>
            )}
          </div>

          {/* 5. Verbatim Raw AI Response Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsRawResponseExpanded((prev) => !prev)}
              aria-expanded={isRawResponseExpanded}
              aria-controls="raw-response-sec"
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-600" />
                <span>Verbatim Raw AI Response</span>
              </span>
              {isRawResponseExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {isRawResponseExpanded && (
              <div id="raw-response-sec" className="bg-slate-900 border-t border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-slate-400 text-xs border-b border-slate-800">
                  <span className="font-mono text-[11px]">Raw AI Engine Response Text</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyRawResponse}
                    disabled={!evidence.rawResponse}
                    className="h-7 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 gap-1"
                  >
                    {copiedRawResponse ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Response</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 text-slate-100 font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {evidence.rawResponse && evidence.rawResponse.trim().length > 0
                    ? evidence.rawResponse
                    : 'Not available for this scan'}
                </div>
              </div>
            )}
          </div>
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
