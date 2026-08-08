'use client';

import React from 'react';
import type { Recommendation, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  FileText,
  ListOrdered,
  Globe,
  Sparkles,
  Cpu,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';

interface RecommendationDetailDialogProps {
  recommendation: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (recId: string, status: RecommendationStatus) => void;
  isUpdating?: boolean;
}

export function RecommendationDetailDialog({
  recommendation,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}: RecommendationDetailDialogProps) {
  if (!isOpen || !recommendation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rec-detail-title"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 flex items-start justify-between gap-4 bg-neutral-950/40">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
                {recommendation.priority}
              </span>
              {recommendation.generationMethod === 'ai_phrased' ? (
                <span className="inline-flex items-center gap-1 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI Grounded Phrasing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                  <Cpu className="w-3 h-3" /> Deterministic Rule
                </span>
              )}
            </div>
            <h2
              id="rec-detail-title"
              className="text-xl font-bold text-neutral-100 flex items-center gap-2"
            >
              <Lightbulb className="w-6 h-6 text-amber-400 shrink-0" />
              <span>{recommendation.title}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-neutral-300">
          {/* Executive Summary */}
          <div className="space-y-2 bg-neutral-950/40 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">
              Executive Summary & Why This Recommendation Exists
            </h3>
            <p className="text-neutral-200 leading-relaxed">{recommendation.summary}</p>
          </div>

          {/* Impact, Effort & Confidence Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <div className="text-xs text-neutral-400">Estimated Impact</div>
                <div className="font-semibold text-neutral-100 capitalize">
                  {recommendation.estimatedImpact}
                </div>
              </div>
            </div>

            <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs text-neutral-400">Estimated Effort</div>
                <div className="font-semibold text-neutral-100 capitalize">
                  {recommendation.estimatedEffort.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs text-neutral-400">Evidence Confidence</div>
                <div className="font-semibold text-neutral-100">
                  {Math.round(recommendation.confidenceScore * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Evidence Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Supporting Evidence Rows ({recommendation.evidence.length})</span>
              </h3>
              <span className="text-xs text-neutral-400">Deterministic trace</span>
            </div>

            <div className="space-y-2">
              {recommendation.evidence.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80 flex items-start gap-3 text-xs"
                >
                  <span className="font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className="text-neutral-200 leading-normal">{ev.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono pt-1">
                      {ev.pageId && <span>Page ID: {ev.pageId}</span>}
                      {ev.scanId && <span>Scan ID: {ev.scanId}</span>}
                      {ev.citationId && <span>Citation ID: {ev.citationId}</span>}
                      {ev.competitorScanId && (
                        <span>Competitor Scan ID: {ev.competitorScanId}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Steps */}
          {recommendation.implementationSteps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-400" />
                <span>Step-by-Step Implementation Guide</span>
              </h3>
              <ol className="space-y-2 list-decimal list-inside bg-neutral-950/40 p-4 rounded-lg border border-neutral-800">
                {recommendation.implementationSteps.map((step, idx) => (
                  <li key={idx} className="text-neutral-200 leading-relaxed pl-1">
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Affected Pages */}
          {recommendation.affectedPages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Affected URLs ({recommendation.affectedPages.length})</span>
              </h3>
              <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 space-y-1 max-h-36 overflow-y-auto">
                {recommendation.affectedPages.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-cyan-400 hover:underline py-1 px-2 rounded hover:bg-neutral-900/60"
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Current Status:</span>
            <span className="text-xs font-semibold text-neutral-200 uppercase bg-neutral-800 px-2 py-0.5 rounded">
              {recommendation.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {recommendation.status !== 'completed' && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => {
                  onUpdateStatus(recommendation.id, 'completed');
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Resolved
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
