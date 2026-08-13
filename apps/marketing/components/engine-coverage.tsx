'use client';

import React, { useState } from 'react';
import { Cpu, CheckCircle2, Shield, RefreshCw, Zap, ArrowRight } from 'lucide-react';

const engineRegistries = [
  {
    name: 'Google Gemini',
    models: 'Gemini 1.5 Pro & Flash',
    indexSource: 'Google Real-time Search Index & Knowledge Graph',
    refreshRate: 'Every 4 Hours',
    citationDepth: '96% Primary Node Tracing',
    status: 'Operational',
    score: 91,
    sampleDiff:
      'Recommends brand based on official documentation, Google Cloud partners, and structured schema metadata.',
  },
  {
    name: 'ChatGPT (OpenAI Search)',
    models: 'GPT-4o & SearchGPT',
    indexSource: 'Bing Web Index + OpenAI Proprietary Web Scraper',
    refreshRate: 'Every 2 Hours',
    citationDepth: '94% Direct URL Attribution',
    status: 'Operational',
    score: 88,
    sampleDiff:
      'Prefers G2 enterprise reviews, GitHub documentation repositories, and recent press announcements.',
  },
  {
    name: 'Perplexity Pro',
    models: 'Sonar Deep Research & Claude 3.5',
    indexSource: 'Live Multi-Index Web Crawler + Perplexity Graph',
    refreshRate: 'Every 1 Hour',
    citationDepth: '98% Granular Footnote Mapping',
    status: 'Operational',
    score: 95,
    sampleDiff:
      'Cites high-density technical specs, API docs, and third-party benchmark comparisons.',
  },
  {
    name: 'Claude 3.5 Sonnet',
    models: 'Anthropic Web Search Engine',
    indexSource: 'Brave Search API + Custom Index Integration',
    refreshRate: 'Every 6 Hours',
    citationDepth: '89% High-Precision Synthesis',
    status: 'Operational',
    score: 84,
    sampleDiff:
      'Focuses on developer documentation, whitepapers, and verifiable open-source evidence.',
  },
  {
    name: 'Microsoft Copilot',
    models: 'GPT-4o + Bing Web Index',
    indexSource: 'Bing Enterprise Index + Microsoft Graph',
    refreshRate: 'Every 4 Hours',
    citationDepth: '87% Footnote Linking',
    status: 'Operational',
    score: 82,
    sampleDiff:
      'Heavy preference for Azure marketplace listings, Microsoft partner network, and TechCommunity posts.',
  },
  {
    name: 'Meta AI',
    models: 'Llama 3.1 405B Web Engine',
    indexSource: 'Meta Search Synthesizer + Web Crawl',
    refreshRate: 'Every 12 Hours',
    citationDepth: '81% Entity Extraction',
    status: 'Operational',
    score: 79,
    sampleDiff:
      'Relies on broad news coverage, social media discussions, and open web encyclopedia entries.',
  },
];

export function EngineCoverage() {
  const [selectedEngine, setSelectedEngine] = useState(0);

  return (
    <section id="engines" className="border-b border-slate-200 bg-[#fafafb] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            04 // Provider Registry
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Complete Multi-Engine AI Coverage
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            AI Visibility OS continuously monitors and audits the top 6 generative search engine registries, tracking how different underlying models index and recommend your company.
          </p>
        </div>

        {/* Matrix Grid of Supported AI Engines */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engineRegistries.map((eng, idx) => (
            <div
              key={eng.name}
              onClick={() => setSelectedEngine(idx)}
              className={`cursor-pointer flex flex-col justify-between rounded-xl border p-6 transition-all ${
                selectedEngine === idx
                  ? 'border-slate-950 bg-white shadow-lg ring-1 ring-slate-950'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h3 className="text-base font-bold text-slate-950">{eng.name}</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Score: {eng.score}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-mono text-slate-400">Models:</span>
                    <span className="font-medium text-slate-900">{eng.models}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-slate-400">Scan Cadence:</span>
                    <span className="font-medium text-slate-900">{eng.refreshRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-slate-400">Citation Depth:</span>
                    <span className="font-medium font-mono text-emerald-700">{eng.citationDepth}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 line-clamp-2">
                  <strong className="text-slate-900">Retrieval Bias:</strong> {eng.sampleDiff}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400">
                <span>{eng.indexSource.split('+')[0]}</span>
                <span className="text-slate-900 font-semibold flex items-center gap-1">
                  View Registry <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Engine Deep Inspection Box */}
        <div className="mt-10 rounded-xl border border-slate-300 bg-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="font-mono text-xs font-semibold text-slate-500 uppercase">
                Active Provider Inspection
              </span>
              <h3 className="text-2xl font-bold text-slate-950">
                {engineRegistries[selectedEngine].name} Registry Detail
              </h3>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
              {engineRegistries[selectedEngine].status} • Refresh {engineRegistries[selectedEngine].refreshRate}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="rounded-lg border border-slate-200 bg-[#fafafb] p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Indexing Engine</span>
              <p className="mt-1 font-semibold text-slate-900">
                {engineRegistries[selectedEngine].indexSource}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#fafafb] p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Attribution Precision</span>
              <p className="mt-1 font-semibold text-slate-900">
                {engineRegistries[selectedEngine].citationDepth}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#fafafb] p-4">
              <span className="font-mono text-xs text-slate-500 uppercase">Optimization Strategy</span>
              <p className="mt-1 font-semibold text-slate-900">
                Targeted schema markup & amp; technical docs indexing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
