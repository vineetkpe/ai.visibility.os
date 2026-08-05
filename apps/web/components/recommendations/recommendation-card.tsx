'use client';

import React from 'react';
import type { Recommendation, RecommendationStatus } from '@ai-visibility-os/recommendations';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onOpenDetails: (rec: Recommendation) => void;
  onUpdateStatus: (recId: string, status: RecommendationStatus) => void;
  isUpdating?: boolean;
}

export function RecommendationCard({
  recommendation,
  onOpenDetails,
  onUpdateStatus,
  isUpdating = false,
}: RecommendationCardProps) {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace('_', ' ').toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
            <XCircle className="w-3 h-3" /> Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Open
          </span>
        );
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-all flex flex-col justify-between gap-4 group">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border uppercase tracking-wider ${getPriorityStyle(
                recommendation.priority
              )}`}
            >
              {recommendation.priority}
            </span>
            <span className="text-xs text-neutral-400 font-mono uppercase bg-neutral-800/80 px-2 py-0.5 rounded">
              {getCategoryLabel(recommendation.category)}
            </span>
            {recommendation.generationMethod === 'ai_phrased' ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full"
                title="Phrased by Gemini based strictly on detected evidence"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" /> AI Phrased
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full"
                title="Deterministic detection rule"
              >
                <Cpu className="w-3 h-3 text-neutral-400" /> Deterministic
              </span>
            )}
          </div>
          {getStatusBadge(recommendation.status)}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-100 group-hover:text-cyan-400 transition-colors flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <span>{recommendation.title}</span>
        </h3>

        {/* Summary */}
        <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
          {recommendation.summary}
        </p>
      </div>

      {/* Metadata Badges & Evidence Bar */}
      <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>Impact: <strong className="text-neutral-200 capitalize">{recommendation.estimatedImpact}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Effort: <strong className="text-neutral-200 capitalize">{recommendation.estimatedEffort.replace('_', ' ')}</strong></span>
          </div>
          <div className="flex items-center gap-1" title="Evidence confidence score">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conf: <strong className="text-neutral-200">{Math.round(recommendation.confidenceScore * 100)}%</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
            <FileText className="w-3 h-3 text-cyan-400" />
            {recommendation.evidence.length} Evidence Row(s)
          </span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenDetails(recommendation)}
          className="text-xs bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-200 flex items-center gap-1"
        >
          <span>View Details & Evidence</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
        </Button>

        <div className="flex items-center gap-1.5">
          {recommendation.status === 'open' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(recommendation.id, 'in_progress')}
              className="text-xs text-blue-400 hover:bg-blue-950/40"
            >
              In Progress
            </Button>
          )}

          {recommendation.status !== 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(recommendation.id, 'completed')}
              className="text-xs text-emerald-400 hover:bg-emerald-950/40"
            >
              Mark Resolved
            </Button>
          )}

          {recommendation.status !== 'dismissed' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(recommendation.id, 'dismissed')}
              className="text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
