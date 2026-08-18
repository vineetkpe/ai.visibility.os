'use client';

import React, { useState } from 'react';
import type { Recommendation, RecommendationPriority, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { generateRecommendationsAction, getRecommendationsOverviewAction, updateRecommendationStatusAction } from './actions';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { RecommendationDetailDialog } from '@/components/recommendations/recommendation-detail-dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationsClientViewProps { projectId: string; initialRecommendations: Recommendation[]; }

function PriorityTag({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const cls = p === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : p === 'high' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${cls}`}>{priority}</span>;
}

export function RecommendationsClientView({ projectId, initialRecommendations }: RecommendationsClientViewProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedRecId, setSelectedRecId] = useState<string | null>(initialRecommendations[0]?.id || null);

  const refreshRecommendations = async () => {
    const filterObj: { status?: RecommendationStatus; category?: string; priority?: RecommendationPriority } = {};
    if (selectedStatus !== 'all') filterObj.status = selectedStatus as RecommendationStatus;
    if (selectedCategory !== 'all') filterObj.category = selectedCategory;
    if (selectedPriority !== 'all') filterObj.priority = selectedPriority as RecommendationPriority;
    const res = await getRecommendationsOverviewAction(projectId, filterObj);
    if (res.success && res.data) { setRecommendations(res.data); if (res.data.length > 0 && !selectedRecId) setSelectedRecId(res.data[0].id); }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      toast.info('Reviewing your latest evidence...');
      const res = await generateRecommendationsAction(projectId);
      if (!res.success) toast.error(res.error || 'Unable to generate recommendations.');
      else if (res.data) { toast.success(`${res.data.createdCount} new opportunities found.`); await refreshRecommendations(); }
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

  const filteredRecs = recommendations.filter((r) => (selectedStatus === 'all' || r.status === selectedStatus) && (selectedCategory === 'all' || r.category === selectedCategory) && (selectedPriority === 'all' || r.priority === selectedPriority));
  const selectedRec = filteredRecs.find((r) => r.id === selectedRecId) || filteredRecs[0] || null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500"><Lightbulb className="h-4 w-4 text-slate-900" /><span>REMEDIATION WORKSPACE</span></div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Prioritized Action Queue</h1>
          <p className="mt-1 text-xs text-slate-600">Recommendations are derived from persisted crawl and visibility evidence.</p>
        </div>
        <Button onClick={handleGenerateRecommendations} disabled={isGenerating} className="gap-1.5 bg-slate-950 text-white hover:bg-slate-800 font-semibold border border-slate-900 text-xs px-3.5 h-8 shadow-2xs shrink-0">
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />}<span>{isGenerating ? 'Evaluating Data...' : 'Analyze Evidence'}</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-lg border border-[#e2e4e9] bg-white shadow-2xs overflow-hidden flex flex-col">
          <div className="border-b border-[#e2e4e9] bg-[#faf9f6] p-3.5"><div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">PRIORITIZED ACTION QUEUE ({filteredRecs.length} RECOMMENDATIONS)</div></div>
          <div className="divide-y divide-[#e2e4e9] overflow-y-auto max-h-[600px]">
            {filteredRecs.map((rec) => {
              const isSelected = selectedRec?.id === rec.id;
              return <div key={rec.id} onClick={() => setSelectedRecId(rec.id)} className={`p-4 transition-all cursor-pointer border-l-4 ${isSelected ? 'bg-slate-50 border-l-slate-950 font-bold shadow-2xs' : 'border-l-transparent hover:bg-slate-50/60'}`}>
                <div className="flex items-center justify-between text-xs mb-1.5"><PriorityTag priority={rec.priority} /><span className="font-mono font-bold text-slate-500 text-[10px]">Impact {rec.impactScore}/5 · Effort {rec.effortScore}/5</span></div>
                <div className="text-xs font-bold text-slate-950 leading-snug">{rec.title}</div>
                <div className="mt-1 text-[11px] font-mono text-slate-500">Category: {rec.category}</div>
              </div>;
            })}
            {!filteredRecs.length && <div className="p-8 text-center text-xs text-slate-500">No action items found.</div>}
          </div>
        </div>

        {selectedRec ? <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-3"><div><span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">REMEDIATION BLUEPRINT #{selectedRec.id.slice(0, 4)}</span><h2 className="text-lg font-extrabold text-slate-950 mt-0.5">{selectedRec.title}</h2></div>
            <Button variant="outline" size="sm" className="h-7 text-[11px] font-mono font-semibold border-[#e2e4e9] text-slate-700 hover:text-slate-950" onClick={() => { navigator.clipboard.writeText(selectedRec.description || selectedRec.title); toast.success('Blueprint copied'); }}>Copy Blueprint</Button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">{selectedRec.description}</p>
          <div className="rounded-lg border border-slate-900 bg-slate-950 p-4 text-white space-y-3 font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2"><span>// Evidence-backed remediation</span><span className="text-emerald-400 font-bold">PERSISTED EVIDENCE</span></div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">{`# ${selectedRec.title}\n- Priority: ${selectedRec.priority}\n- Category: ${selectedRec.category}\n- Impact score: ${selectedRec.impactScore}/5\n- Effort score: ${selectedRec.effortScore}/5\n- Evidence refs: ${selectedRec.evidence.length}`}</pre>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#e2e4e9] text-xs"><span className="font-mono text-[11px] text-slate-500">Status: <strong>{selectedRec.status.replace('_', ' ')}</strong></span>
            <Button onClick={() => handleUpdateStatus(selectedRec.id, selectedRec.status === 'resolved' ? 'open' : 'resolved')} disabled={updatingId === selectedRec.id} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold border border-amber-600/30 text-xs px-3.5 h-8 shadow-2xs">{updatingId === selectedRec.id ? 'Updating...' : selectedRec.status === 'resolved' ? 'Reopen Task' : 'Mark as Complete'}</Button>
          </div>
        </div> : <div className="rounded-lg border border-[#e2e4e9] bg-white p-8 text-center text-xs text-slate-500">Select a recommendation from the queue to view remediation blueprint.</div>}
      </div>
    </div>
  );
}
