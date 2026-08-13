'use client';

import React, { useState } from 'react';
import { BarChart3, FileText, Download, TrendingUp, Filter, CheckCircle2, ArrowUpRight } from 'lucide-react';

const reportCategories = [
  { category: 'Developer APIs & SDKs', promptsScanned: 3800, visibility: '94%', topEngine: 'Perplexity Pro' },
  { category: 'Enterprise SOC2 Compliance', promptsScanned: 2900, visibility: '89%', topEngine: 'ChatGPT (SearchGPT)' },
  { category: 'Global Payouts & FX Pricing', promptsScanned: 3200, visibility: '82%', topEngine: 'Google Gemini' },
  { category: 'Billing Migration & Setup', promptsScanned: 2500, visibility: '76%', topEngine: 'Claude 3.5 Sonnet' },
];

const topSources = [
  { domain: 'stripe.com/docs/api', citations: 4120, share: '36%', type: 'Primary Docs' },
  { domain: 'g2.com/products/stripe/reviews', citations: 2340, share: '21%', type: 'Analyst Review' },
  { domain: 'github.com/stripe/stripe-node', citations: 1890, share: '16%', type: 'Developer Repo' },
  { domain: 'techcrunch.com/fintech-benchmarks', citations: 1120, share: '10%', type: 'Industry News' },
  { domain: 'wikipedia.org/wiki/Stripe_(company)', citations: 890, share: '8%', type: 'Encyclopedia' },
];

export function AnalyticsReport() {
  const [selectedCategory, setSelectedCategory] = useState(0);

  return (
    <section id="analytics" className="border-b border-slate-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12 border-b border-slate-200 gap-6">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
              07 // Executive Analytics
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              C-Suite Intelligence Reports
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 shadow-sm transition-all">
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export PDF Audit Report</span>
            </button>
          </div>
        </div>

        {/* Audit Report Viewer Container */}
        <div className="mt-12 rounded-xl border border-slate-300 bg-[#fafafb] p-6 sm:p-8 shadow-sm">
          {/* Executive Summary Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8 border-b border-slate-200">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">30-Day Visibility Trend</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">87.4</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  +11.2%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Continuous baseline scan</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Total Prompts Audited</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">12,400</span>
                <span className="text-xs font-semibold text-slate-700">Multi-Region</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Across 6 AI registries</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Citations Attributed</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">11,450</span>
                <span className="text-xs font-semibold text-emerald-700">92.3% Rate</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">10,340 primary source links</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Brand Sentiment</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">96%</span>
                <span className="text-xs font-semibold text-emerald-700">Positive</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">0 halluncination warnings</span>
            </div>
          </div>

          {/* Report Middle Row: SVG Trend Graph & Category Breakdown */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SVG Visibility Trend Graphic */}
            <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-sm font-bold text-slate-950">
                  30-Day Visibility Index Acceleration
                </span>
                <span className="font-mono text-xs text-slate-500">
                  Daily Synthetic Sampling
                </span>
              </div>

              {/* Clean Editorial SVG Chart */}
              <div className="relative h-56 w-full pt-4">
                <svg viewBox="0 0 700 200" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#090d16" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#e2e4e9" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#e2e4e9" strokeDasharray="4 4" />
                  <line x1="0" y1="140" x2="700" y2="140" stroke="#e2e4e9" strokeDasharray="4 4" />

                  {/* Area fill */}
                  <path
                    d="M 0 160 Q 150 140, 250 110 T 500 70 T 700 35 L 700 200 L 0 200 Z"
                    fill="url(#chartGradient)"
                  />
                  {/* Trend line */}
                  <path
                    d="M 0 160 Q 150 140, 250 110 T 500 70 T 700 35"
                    fill="none"
                    stroke="#090d16"
                    strokeWidth="3.5"
                  />
                </svg>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-slate-400 mt-2">
                <span>Day 1: 76.2</span>
                <span>Day 10: 79.5</span>
                <span>Day 20: 84.1</span>
                <span className="font-bold text-slate-900">Day 30: 87.4</span>
              </div>
            </div>

            {/* Top Cited Sources Leaderboard Table */}
            <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-sm font-bold text-slate-950">Top LLM Citation Sources</span>
                <span className="font-mono text-xs text-slate-500">Share %</span>
              </div>

              <div className="space-y-3">
                {topSources.map((src) => (
                  <div
                    key={src.domain}
                    className="flex items-center justify-between rounded border border-slate-100 bg-[#fbfcfd] p-2.5 text-xs"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-semibold text-slate-900 truncate">{src.domain}</span>
                      <span className="font-mono text-[11px] text-slate-500">{src.type}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-slate-500">{src.citations} links</span>
                      <span className="font-extrabold text-slate-950 bg-slate-200/80 px-2 py-0.5 rounded">
                        {src.share}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
