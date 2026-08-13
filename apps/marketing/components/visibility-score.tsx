'use client';

import React, { useState } from 'react';
import { BarChart3, CheckCircle, HelpCircle, ShieldCheck, Sparkles, TrendingUp, Sliders } from 'lucide-react';

const scoreSubindices = [
  {
    id: 'citation',
    name: 'Citation Frequency Index',
    weight: '35% Weight',
    score: 88,
    description:
      'Calculates the percentage of synthetic buyer queries in which your domain or official documentation is explicitly linked as a citation source.',
    formula: 'Total Cited Responses ÷ Total Category Prompts',
    status: 'Optimal (88/100)',
  },
  {
    id: 'sentiment',
    name: 'Sentiment & Accuracy Alignment',
    weight: '25% Weight',
    score: 94,
    description:
      'Evaluates the semantic precision of AI response text to ensure zero negative hallucinations regarding features, compliance, or enterprise pricing.',
    formula: 'Semantic Accuracy Vector Match vs Ground-Truth Spec',
    status: 'Excellent (94/100)',
  },
  {
    id: 'sov',
    name: 'Share of Voice vs Market Competitors',
    weight: '20% Weight',
    score: 79,
    description:
      'Measures how frequently your brand appears as the #1 recommended solution compared to direct category competitors in side-by-side prompt benchmarks.',
    formula: 'Brand #1 Placements ÷ (Brand #1 Placements + Competitor #1 Placements)',
    status: 'Strong (79/100)',
  },
  {
    id: 'authority',
    name: 'Source Authority Weighting',
    weight: '20% Weight',
    score: 86,
    description:
      'Scores the domain authority and indexing reliability of third-party sources (e.g. G2 reviews, TechCrunch, docs) cited by LLMs on your behalf.',
    formula: 'Weighted PageRank & Citation Index of Retrieval Sources',
    status: 'High Trust (86/100)',
  },
];

const modelScores = [
  { model: 'Google Gemini 1.5 Pro', score: 89, change: '+6%', status: 'Leading Citation' },
  { model: 'ChatGPT (OpenAI Search)', score: 85, change: '+12%', status: 'High Accuracy' },
  { model: 'Perplexity Sonar Deep', score: 92, change: '+4%', status: 'Primary Source' },
  { model: 'Claude 3.5 Sonnet', score: 81, change: '+8%', status: 'Solid Presence' },
];

export function VisibilityScore() {
  const [activeSubindex, setActiveSubindex] = useState(0);

  return (
    <section id="visibility-score" className="border-b border-slate-200 bg-[#fafafb] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            02 // Mathematical Framework
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            The Enterprise AI Visibility Index
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Our proprietary 0-100 scoring model quantifies your brand’s authority in generative search by unifying citation frequency, semantic sentiment accuracy, and competitor share of voice.
          </p>
        </div>

        {/* Score Visualizer Workspace Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 0-100 Score Gauge & Model Breakdown */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="font-mono text-xs text-slate-500 uppercase">Composite Index</span>
                <h3 className="text-xl font-bold text-slate-950">AI Visibility Score</h3>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                Tier 1 Enterprise
              </span>
            </div>

            {/* Big Score Radial Graphic */}
            <div className="my-8 flex flex-col items-center justify-center p-6 bg-[#fafafb] rounded-xl border border-slate-200">
              <div className="relative flex items-center justify-center">
                {/* SVG Radial Arc */}
                <svg className="h-44 w-44 transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="#e2e4e9"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="#090d16"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={452}
                    strokeDashoffset={452 - (452 * 87) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-5xl font-extrabold text-slate-950 font-mono tracking-tight">
                    87
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-widest mt-1">
                    Out of 100
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+14.2 points in Q3 after GEO remediation</span>
              </div>
            </div>

            {/* Model Breakdown List */}
            <div className="space-y-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Model Engine Breakdown:
              </span>
              {modelScores.map((item) => (
                <div
                  key={item.model}
                  className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-[#fbfcfd] p-3 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{item.model}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-700 font-bold">{item.change}</span>
                    <span className="font-extrabold text-slate-950 text-sm bg-slate-200/70 px-2 py-0.5 rounded">
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Subindices Breakdown */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                Score Components & Attribution Weights
              </span>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                Click to Inspect Score Calculations
              </h3>

              {/* Subindex Tab Buttons */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scoreSubindices.map((sub, idx) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubindex(idx)}
                    className={`flex flex-col text-left p-4 rounded-lg border transition-all ${
                      activeSubindex === idx
                        ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                        : 'border-slate-200 bg-[#fafafb] text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                          activeSubindex === idx
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {sub.weight}
                      </span>
                      <span
                        className={`font-mono text-sm font-extrabold ${
                          activeSubindex === idx ? 'text-emerald-300' : 'text-slate-950'
                        }`}
                      >
                        {sub.score}/100
                      </span>
                    </div>
                    <span className="mt-3 text-sm font-bold leading-tight">{sub.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Subindex Detail Card */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-[#f9fafb] p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <span className="text-sm font-bold text-slate-950">
                    {scoreSubindices[activeSubindex].name} Detail
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded">
                    {scoreSubindices[activeSubindex].status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {scoreSubindices[activeSubindex].description}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs font-mono text-slate-700">
                  <span className="font-bold text-slate-900">Formula:</span>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-800">
                    {scoreSubindices[activeSubindex].formula}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
