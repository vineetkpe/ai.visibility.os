'use client';

import React from 'react';
import Link from 'next/link';
import type { DashboardOverviewData } from '@/app/(dashboard)/dashboard/actions';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { cancelJobAction } from '@/app/(dashboard)/dashboard/actions';
import {
  Globe,
  Sparkles,
  Play,
  TrendingUp,
  Building,
  Lightbulb,
  Activity,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Pencil,
  XCircle,
  Loader2,
} from 'lucide-react';

// Custom Tooltip for Visibility Trend Chart
function VisibilityTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; score: number; prompt: string } }>;
}) {
  if (active && payload && payload.length > 0 && payload[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 text-xs shadow-xl space-y-1">
        <div className="font-semibold text-slate-300">{data.date}</div>
        <div className="text-amber-400 font-bold text-sm">Visibility Score: {data.score}/100</div>
        <div className="text-slate-400 italic truncate max-w-xs">
          Prompt: &quot;{data.prompt}&quot;
        </div>
      </div>
    );
  }
  return null;
}

// 1. Project Overview & Latest Scan Widget
export function ProjectOverviewWidget({
  project,
  latestScan,
  onTriggerScan,
  isTriggering = false,
}: {
  project: DashboardOverviewData['project'];
  latestScan: DashboardOverviewData['latestScan'];
  onTriggerScan?: () => void;
  isTriggering?: boolean;
}) {
  return (
    <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Active Project Overview</span>
        </div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>{project.name}</span>
          <Link
            href="/settings"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
            title="Edit Project Name"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-2.5 py-0.5 rounded-full ml-1">
            Active
          </span>
        </h2>
        {project.primaryDomain ? (
          <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.primaryDomain}</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400">No primary domain configured</p>
        )}
      </div>

      {/* Latest Scan Badge & Trigger Button */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">Latest Scan Status</div>
          {latestScan ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                {latestScan.status}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                {latestScan.visibilityScore !== null
                  ? `${latestScan.visibilityScore}/100`
                  : 'Pending'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No scans executed yet</div>
          )}
        </div>

        <Button
          size="sm"
          onClick={onTriggerScan}
          disabled={isTriggering}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs gap-1.5 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>{isTriggering ? 'Dispatching...' : 'Start New Scan'}</span>
        </Button>
      </div>
    </div>
  );
}

// 2. Mention History Trend Chart
export function VisibilityTrendChart({
  mentionHistory,
}: {
  mentionHistory: DashboardOverviewData['visibility']['mentionHistory'];
}) {
  if (mentionHistory.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span>AI Visibility Trend</span>
          </h3>
        </div>
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center text-xs text-slate-500">
          No completed scans recorded yet. Run your first scan to visualize score trends over time.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span>AI Visibility Score Trend</span>
          </h3>
          <p className="text-xs text-slate-500">
            Historical visibility scores across completed AI engine scans
          </p>
        </div>
      </div>

      <div className="sr-only">
        <h4>AI Visibility Score Trend Data Table</h4>
        <table>
          <caption>Historical AI Visibility scores across completed scans</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Visibility Score</th>
              <th scope="col">Query Prompt</th>
            </tr>
          </thead>
          <tbody>
            {mentionHistory.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.score}/100</td>
                <td>{item.prompt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mentionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
            <Tooltip content={<VisibilityTrendTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              name="Visibility Score"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 3. AI Platform Breakdown Widget (Gemini real data; others explicit unavailable state)
export function AIPlatformBreakdownWidget({
  platforms,
}: {
  platforms: DashboardOverviewData['visibility']['platformBreakdown'];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Platform Breakdown</span>
        </h3>
        <p className="text-xs text-slate-500">
          Evaluated search visibility scores by AI engine provider
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {platforms.map((p) => (
          <div
            key={p.provider}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
              p.isAvailable
                ? 'bg-amber-500/5 border-amber-500/30 text-slate-900'
                : 'bg-slate-50/80 border-slate-200 text-slate-500 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold truncate">{p.displayName}</span>
              {p.isAvailable ? (
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Unavailable
                </span>
              )}
            </div>

            <div>
              {p.isAvailable ? (
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-slate-900">
                    {p.score !== null ? `${p.score}/100` : 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500">{p.scansCount} completed scan(s)</div>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Not yet available</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Integration coming in future release
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Competitor Benchmarking Widget (Bar charts & Tier 2 indicators)
export function CompetitorBenchmarkingWidget({
  competitors,
}: {
  competitors: DashboardOverviewData['competitors'];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-600" />
            <span>Competitor Benchmarks</span>
          </h3>
          <p className="text-xs text-slate-500">
            Compare brand visibility and citation share against tracked competitors
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="text-xs gap-1">
          <Link href="/competitors">
            <span>Manage Competitors</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      {competitors.topCompetitors.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">No competitors tracked yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add competitor domains to compare AI search visibility scores and citation
            co-occurrence.
          </p>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/competitors">Add First Competitor</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Visibility Score Comparison */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Visibility Score Comparison
            </h4>
            <div className="sr-only">
              <h4>Competitor Visibility Score Table</h4>
              <table>
                <caption>Visibility Score comparison between your brand and competitors</caption>
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Visibility Score</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.visibilityComparison.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.score}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={competitors.visibilityComparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    formatter={(val: number | string) => [`${val}/100`, 'Visibility Score']}
                  />
                  <Bar dataKey="score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Citation Distribution */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Citation Share Distribution
            </h4>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={competitors.citationComparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: number | string) => [`${val} citation(s)`, 'Citations']}
                  />
                  <Bar dataKey="citationCount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Recommendations Summary Widget (Links to /recommendations)
export function RecommendationsSummaryWidget({
  recommendations,
}: {
  recommendations: DashboardOverviewData['recommendations'];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>AI Optimization Recommendations</span>
          </h3>
          <p className="text-xs text-slate-500">
            Actionable optimization tasks grounded in platform evidence
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="text-xs gap-1">
          <Link href="/recommendations">
            <span>View All Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Critical Card */}
        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Critical Priority
            </span>
            <span className="bg-red-500/20 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {recommendations.openCriticalCount}
            </span>
          </div>

          <div className="space-y-2">
            {recommendations.criticalList.length > 0 ? (
              recommendations.criticalList.map((rec) => (
                <div
                  key={rec.id}
                  className="text-xs text-slate-800 font-medium line-clamp-1 border-b border-red-500/10 pb-1"
                >
                  • {rec.title}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic">No open critical issues</div>
            )}
          </div>
        </div>

        {/* High Priority Card */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              High Priority
            </span>
            <span className="bg-amber-500/20 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {recommendations.openHighCount}
            </span>
          </div>

          <div className="space-y-2">
            {recommendations.highPriorityList.length > 0 ? (
              recommendations.highPriorityList.map((rec) => (
                <div
                  key={rec.id}
                  className="text-xs text-slate-800 font-medium line-clamp-1 border-b border-amber-500/10 pb-1"
                >
                  • {rec.title}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic">No open high priority issues</div>
            )}
          </div>
        </div>

        {/* Recently Resolved Card */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Recently Resolved
            </span>
            <span className="bg-emerald-500/20 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {recommendations.totalResolvedCount}
            </span>
          </div>

          <div className="space-y-2">
            {recommendations.recentlyResolvedList.length > 0 ? (
              recommendations.recentlyResolvedList.map((rec) => (
                <div
                  key={rec.id}
                  className="text-xs text-slate-800 font-medium line-clamp-1 border-b border-emerald-500/10 pb-1"
                >
                  ✓ {rec.title}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic">No resolved tasks recorded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Website Health Widget
export function WebsiteHealthWidget({
  health,
}: {
  health: DashboardOverviewData['websiteHealth'];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Website Health & Technical SEO</span>
        </h3>
        <p className="text-xs text-slate-500">
          Crawl coverage, Schema.org markup, and metadata completeness
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pages */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs text-slate-500">Pages Crawled</div>
          <div className="text-2xl font-bold text-slate-900">{health.totalPages}</div>
          <div className="text-[11px] text-slate-400">Indexed for context synthesis</div>
        </div>

        {/* Schema Coverage */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Schema.org Coverage</span>
            <span className="font-bold text-slate-900">{health.schemaCoveragePct}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${health.schemaCoveragePct}%` }}
            />
          </div>
        </div>

        {/* Metadata Coverage */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Metadata Completeness</span>
            <span className="font-bold text-slate-900">{health.metadataCoveragePct}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${health.metadataCoveragePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Recent Activity & Jobs Widget
export function RecentActivityWidget({
  recentActivity,
}: {
  recentActivity: DashboardOverviewData['recentActivity'];
}) {
  const [cancellingJobId, setCancellingJobId] = React.useState<string | null>(null);

  const handleCancelJob = async (jobId: string) => {
    try {
      setCancellingJobId(jobId);
      const res = await cancelJobAction(jobId);
      if (res.success) {
        toast.success(
          res.data?.alreadyFinished ? 'Job already finished.' : 'Job cancellation requested.'
        );
      } else {
        toast.error(res.error || 'Failed to cancel job.');
      }
    } catch {
      toast.error('An unexpected error occurred while cancelling job.');
    } finally {
      setCancellingJobId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600" />
          <span>Recent Activity & Background Jobs</span>
        </h3>
        <p className="text-xs text-slate-500">
          Live execution log of system tasks and recommendation transitions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Background Jobs */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            System Jobs Log
          </h4>
          <div className="space-y-2">
            {recentActivity.recentJobs.length > 0 ? (
              recentActivity.recentJobs.map((j) => (
                <div
                  key={j.id}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 font-mono text-[11px]">
                      {j.jobType}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(j.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {j.progress && (
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                        {j.progress.completed} / {j.progress.total} pages
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        j.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : j.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {j.status}
                    </span>
                    {(j.status === 'pending' || j.status === 'running') && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingJobId === j.id}
                        onClick={() => handleCancelJob(j.id)}
                        className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
                        title="Cancel Job"
                      >
                        {cancellingJobId === j.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                No recent background jobs
              </div>
            )}
          </div>
        </div>

        {/* Recommendation History Transitions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Recommendation Transitions
          </h4>
          <div className="space-y-2">
            {recentActivity.recentChanges.length > 0 ? (
              recentActivity.recentChanges.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 flex-1 truncate">
                    <div className="font-medium text-slate-900 truncate">
                      {c.recommendationTitle}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reason: <strong className="text-slate-600">{c.reason}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">
                    {c.newStatus}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                No recommendation changes recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
