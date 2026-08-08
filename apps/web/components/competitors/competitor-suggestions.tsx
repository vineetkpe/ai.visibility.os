'use client';

import React, { useState } from 'react';
import type { CompetitorSuggestion } from '@ai-visibility-os/competitor';
import { confirmSuggestionAction } from '@/app/(dashboard)/competitors/actions';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CompetitorSuggestionsProps {
  projectId: string;
  suggestions: CompetitorSuggestion[];
  onSuggestionConfirmed?: () => void;
}

export function CompetitorSuggestions({
  projectId,
  suggestions,
  onSuggestionConfirmed,
}: CompetitorSuggestionsProps) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleConfirm = async (sug: CompetitorSuggestion) => {
    setLoadingMap((prev) => ({ ...prev, [sug.domain]: true }));

    const res = await confirmSuggestionAction({
      projectId,
      name: sug.name,
      domain: sug.domain,
    });

    setLoadingMap((prev) => ({ ...prev, [sug.domain]: false }));

    if (res.success) {
      toast.success(`Competitor '${sug.name}' confirmed and tracked!`);
      setConfirmedMap((prev) => ({ ...prev, [sug.domain]: true }));
      onSuggestionConfirmed?.();
    } else {
      toast.error(res.error || 'Failed to confirm competitor suggestion.');
    }
  };

  const toggleExpand = (domain: string) => {
    setExpandedMap((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50/60 via-slate-50 to-indigo-50/40 p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Suggested Competitors to Track</h3>
            <p className="text-xs text-slate-500">
              Surfaced from co-occurring citations and entity mentions in your AI model scans.
              Explicit confirmation required.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((sug) => {
          const isConfirmed = confirmedMap[sug.domain];
          const isLoading = loadingMap[sug.domain];
          const isExpanded = expandedMap[sug.domain];

          return (
            <div
              key={sug.domain}
              className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 text-sm">{sug.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">({sug.domain})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Surfaced in{' '}
                    <strong className="text-indigo-600 font-semibold">
                      {sug.coOccurrenceCount}
                    </strong>{' '}
                    scan co-occurrences
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isConfirmed ? 'outline' : 'default'}
                  disabled={isLoading || isConfirmed}
                  onClick={() => handleConfirm(sug)}
                  className="h-8 text-xs shrink-0"
                >
                  {isConfirmed ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      Tracked
                    </>
                  ) : isLoading ? (
                    'Syncing...'
                  ) : (
                    <>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Track Competitor
                    </>
                  )}
                </Button>
              </div>

              {/* Evidence accordion toggle */}
              {sug.evidence.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleExpand(sug.domain)}
                    aria-expanded={isExpanded}
                    aria-controls={`sug-evidence-${sug.domain.replace(/[^a-z0-9]/gi, '-')}`}
                    className="flex items-center space-x-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 rounded px-1"
                  >
                    <FileText className="h-3 w-3 text-indigo-500" />
                    <span>{isExpanded ? 'Hide Evidence' : 'View Scan Evidence'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>

                  {isExpanded && (
                    <div
                      id={`sug-evidence-${sug.domain.replace(/[^a-z0-9]/gi, '-')}`}
                      className="mt-2 space-y-1.5 rounded-md bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100"
                    >
                      {sug.evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0"
                        >
                          <span className="font-semibold text-indigo-700 uppercase tracking-wider text-[9px] mr-1.5">
                            {ev.type}
                          </span>
                          {ev.promptText && (
                            <span className="italic text-slate-700">"{ev.promptText}"</span>
                          )}
                          {ev.contextSnippet && (
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                              {ev.contextSnippet}
                            </p>
                          )}
                          {ev.sourceUrl && (
                            <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              Source: {ev.sourceUrl}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
