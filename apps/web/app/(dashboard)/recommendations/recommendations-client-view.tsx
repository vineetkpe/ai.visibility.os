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
    } catch { toast.error('Something went wrong while generating recommendations.'); }
    finally { setIsGenerating(false); }
  };

  const handleUpdateStatus = async (recId: string, newStatus: RecommendationStatus) => {
    setUpdatingId(recId);
    try {
      const res = await updateRecommendationStatusAction({ projectId, recommendationId: recId, status: newStatus });
      if (res.success) { toast.success(`Marked ${newStatus.replace('_', ' ')}.`); await refreshRecommendations(); }
      else toast.error(res.error || 'Unable to update recommendation.');
    } catch { toast.error('Unable to update recommendation.'); }
    finally { setUpdatingId(null); }
  };

  const filteredRecs = recommendations.filter((r) =>
    (selectedStatus === 'all' || r.status === selectedStatus) &&
    (selectedCategory === 'all' || r.category === selectedCategory) &&
    (selectedPriority === 'all' || r.priority === selectedPriority)
  );
  const totalCount = recommendations.length;
  const criticalCount = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length;
  const quickWinCount = recommendations.filter(r => r.effortScore <= 2).length;
  const resolvedCount = recommendations.filter(r => r.status === 'resolved').length;

  const stat = (label: string, value: number, hint: string, Icon: typeof FileText) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></div><Icon className="h-5 w-5 text-slate-400" /></div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><Lightbulb className="h-4 w-4" /> Optimization</div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Turn evidence into action.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Prioritized opportunities based on your crawl data, visibility results, business context and competitive gaps.</p></div>
        <Button onClick={handleGenerateRecommendations} disabled={isGenerating} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{isGenerating ? 'Analyzing evidence' : 'Refresh opportunities'}</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stat('Open opportunities', totalCount - resolvedCount, 'Items still needing attention', FileText)}{stat('High impact', criticalCount, 'Critical and high priority', AlertTriangle)}{stat('Quick wins', quickWinCount, 'Low-effort opportunities', Zap)}{stat('Resolved', resolvedCount, 'Completed recommendations', CheckCircle2)}</section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">{['open','in_progress','resolved','dismissed','all'].map(st => <button key={st} onClick={() => setSelectedStatus(st)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium ${selectedStatus === st ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>{st.replace('_',' ')}</button>)}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs"><Filter className="h-3.5 w-3.5 text-slate-400" /><select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-slate-700"><option value="all">All categories</option><option value="citation_opportunity">Citation opportunity</option><option value="schema">Schema</option><option value="content">Content</option><option value="metadata">Metadata</option><option value="technical_seo">Technical SEO</option><option value="ai_visibility">AI visibility</option></select><select value={selectedPriority} onChange={e=>setSelectedPriority(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-slate-700"><option value="all">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><Button variant="ghost" size="sm" onClick={refreshRecommendations} className="text-slate-500"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh</Button></div>
        </div>
        <div className="p-4 sm:p-6">{filteredRecs.length ? <div className="grid gap-5 lg:grid-cols-2">{filteredRecs.map(rec => <RecommendationCard key={rec.id} recommendation={rec} onOpenDetails={setSelectedRec} onUpdateStatus={handleUpdateStatus} isUpdating={updatingId === rec.id} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center"><Lightbulb className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-4 text-base font-semibold text-slate-900">Nothing needs attention here.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Change the filters or refresh your evidence to discover new optimization opportunities.</p><Button onClick={handleGenerateRecommendations} disabled={isGenerating} className="mt-5 bg-slate-950 text-white hover:bg-slate-800">{isGenerating ? 'Analyzing…' : 'Find opportunities'}</Button></div>}</div>
      </section>
      <RecommendationDetailDialog recommendation={selectedRec} isOpen={Boolean(selectedRec)} onClose={()=>setSelectedRec(null)} onUpdateStatus={handleUpdateStatus} isUpdating={updatingId === selectedRec?.id} />
    </div>
  );
}
