'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, CheckCircle2, Shield, Info, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoreComponent {
  id: string;
  name: string;
  weight: string;
  score: number;
  description: string;
  formula: string;
  attribution: string;
}

const scoreComponents: ScoreComponent[] = [
  {
    id: 'citation_frequency',
    name: 'Citation Frequency Index',
    weight: '35% Weight',
    score: 88,
    description: 'Measures the proportion of synthetic buyer queries where your brand host domain is cited as an explicit primary source.',
    formula: 'Direct Node Citations / Total Evaluated Prompts',
    attribution: 'High Trust (88/100) — Cited in 18 of 20 core prompt matrices.',
  },
  {
    id: 'sentiment_accuracy',
    name: 'Sentiment & Accuracy Alignment',
    weight: '25% Weight',
    score: 94,
    description: 'Evaluates fact alignment, feature accuracy, and zero hallucination risk across model generated synthesis.',
    formula: 'Factual Statement Precision & Sentiment Weighting',
    attribution: '96% Positive Alignment — Zero negative hallucination flags recorded.',
  },
  {
    id: 'share_of_voice',
    name: 'Share of Voice vs Market Competitors',
    weight: '20% Weight',
    score: 79,
    description: 'Ranks your brand recommendation frequency against tracked category competitors in generative search responses.',
    formula: 'User Mentions / (User Mentions + Competitor Mentions)',
    attribution: '#1 Category Rank — Outranks 3 main category competitors.',
  },
  {
    id: 'source_authority',
    name: 'Source Authority Weighting',
    weight: '20% Weight',
    score: 86,
    description: 'Scores the domain authority and indexing reliability of third-party sources (e.g., G2 reviews, docs, GitHub repositories) cited by LLMs on your behalf.',
    formula: 'Weighted PageRank & Citation Index of Retrieval Sources',
    attribution: 'High Trust (86/100) — Primary index coverage across G2 and GitHub.',
  },
];

export function ScoreClientView({ projectId }: { projectId: string }) {
  const [selectedId, setSelectedId] = useState<string>('citation_frequency');
  const selected = scoreComponents.find((c) => c.id === selectedId) || scoreComponents[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            <Sparkles className="h-4 w-4 text-slate-900" />
            <span>ANALYTICAL DEEP-DIVE</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Score Components & Attribution Weights
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Detailed mathematical breakdown of composite AI visibility index score calculations.
          </p>
        </div>
        <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold h-8 px-3">
          <Link href="/dashboard">← Back to Overview</Link>
        </Button>
      </div>

      {/* Two-Column Analytics Layout (Inspired by Screenshot 2) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Left Column: Composite Index Card */}
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              COMPOSITE INDEX
            </span>
            <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold">
              Tier 1 Enterprise
            </span>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-4 bg-[#faf9f6] rounded border border-[#e2e4e9]">
            <div className="relative flex items-center justify-center h-32 w-32">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" className="stroke-slate-200" strokeWidth="6" fill="transparent" />
                <circle
                  cx="45"
                  cy="45"
                  r="36"
                  className="stroke-slate-950"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - 87 / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-950">87</span>
                <span className="text-[9px] font-mono text-slate-400">OUT OF 100</span>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700">
              <span>+14.2 points in Q3 after GEO remediation</span>
            </div>
          </div>

          {/* Model Engine Breakdown */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              MODEL ENGINE BREAKDOWN:
            </div>
            <div className="divide-y divide-[#e2e4e9] border border-[#e2e4e9] rounded bg-white">
              {[
                { name: 'Google Gemini 1.5 Pro', desc: 'Leading Citation', trend: '+6%', score: 89 },
                { name: 'ChatGPT (OpenAI Search)', desc: 'High Accuracy', trend: '+12%', score: 85 },
                { name: 'Perplexity Sonar Deep', desc: 'Primary Source', trend: '+4%', score: 92 },
                { name: 'Claude 3.5 Sonnet', desc: 'Solid Presence', trend: '+8%', score: 81 },
              ].map((engine) => (
                <div key={engine.name} className="flex items-center justify-between p-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-950">{engine.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{engine.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-600 font-bold text-[11px]">{engine.trend}</span>
                    <span className="font-extrabold text-slate-950 text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {engine.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Score Components Interactive Grid */}
        <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-6">
          <div className="border-b border-[#e2e4e9] pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SCORE COMPONENTS & ATTRIBUTION WEIGHTS
            </span>
            <h2 className="text-sm font-extrabold text-slate-950 mt-0.5">Click to Inspect Score Calculations</h2>
          </div>

          {/* 2x2 Component Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoreComponents.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 rounded border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                      : 'bg-[#faf9f6] text-slate-900 border-[#e2e4e9] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>{c.weight}</span>
                    <span className={`font-extrabold text-xs ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                      {c.score}/100
                    </span>
                  </div>
                  <div className="font-bold text-xs truncate">{c.name}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Component Detail Panel */}
          <div className="rounded border border-[#e2e4e9] bg-[#faf9f6] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e4e9] pb-2">
              <h3 className="font-bold text-xs text-slate-950">{selected.name} Detail</h3>
              <span className="font-mono text-[10px] font-bold text-slate-700 bg-white border border-[#e2e4e9] px-2 py-0.5 rounded">
                {selected.attribution}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selected.description}</p>

            <div className="pt-2 border-t border-[#e2e4e9]">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Calculation Formula</div>
              <code className="block rounded border border-[#e2e4e9] bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-900">
                {selected.formula}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
