'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, ArrowUpRight, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EngineItem {
  name: string;
  score: number;
  models: string;
  cadence: string;
  citationDepth: string;
  retrievalBias: string;
  indexSource: string;
  status: 'Active' | 'Monitoring';
}

const engines: EngineItem[] = [
  {
    name: 'Google Gemini 1.5 Pro',
    score: 91,
    models: 'Gemini 1.5 Pro & Flash',
    cadence: 'Every 4 Hours',
    citationDepth: '96% Primary Node Tracing',
    retrievalBias: 'Recommends brand based on official documentation, Google Cloud partners, and structured schema.',
    indexSource: 'Google Real-time Search Index & Knowledge Graph',
    status: 'Active',
  },
  {
    name: 'ChatGPT (OpenAI Search)',
    score: 88,
    models: 'GPT-4o & SearchGPT',
    cadence: 'Every 2 Hours',
    citationDepth: '94% Direct URL Attribution',
    retrievalBias: 'Prefers G2 enterprise reviews, GitHub documentation repositories, and recent press whitepapers.',
    indexSource: 'Bing Web Index & OpenAI Live Synthesizer',
    status: 'Active',
  },
  {
    name: 'Perplexity Pro',
    score: 95,
    models: 'Sonar Deep Research & Claude 3.5',
    cadence: 'Every 1 Hour',
    citationDepth: '98% Granular Footnote Mapping',
    retrievalBias: 'Cites high-density technical specs, API docs, and third-party benchmark comparisons.',
    indexSource: 'Live Multi-Index Web Crawler',
    status: 'Active',
  },
  {
    name: 'Claude 3.5 Sonnet',
    score: 84,
    models: 'Anthropic Web Search Engine',
    cadence: 'Every 6 Hours',
    citationDepth: '89% High-Precision Synthesis',
    retrievalBias: 'Focuses on developer documentation, whitepapers, and verifiable open-source evidence.',
    indexSource: 'Brave Search API & Anthropic Knowledge Node',
    status: 'Active',
  },
  {
    name: 'Microsoft Copilot',
    score: 82,
    models: 'GPT-4o + Bing Web Index',
    cadence: 'Every 4 Hours',
    citationDepth: '87% Footnote Linking',
    retrievalBias: 'Heavy preference for Azure marketplace listings, Microsoft partner network, and TechCommunity.',
    indexSource: 'Bing Enterprise Index',
    status: 'Monitoring',
  },
  {
    name: 'Meta AI',
    score: 79,
    models: 'Llama 3.1 405B Web Engine',
    cadence: 'Every 12 Hours',
    citationDepth: '81% Entity Extraction',
    retrievalBias: 'Relies on broad news coverage, social media discussions, and open web encyclopedia entries.',
    indexSource: 'Meta Search Synthesizer',
    status: 'Monitoring',
  },
];

export function EnginesClientView({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            <Shield className="h-4 w-4 text-slate-900" />
            <span>AI PROVIDER DIRECTORY</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            AI Search Engine Registries
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Active retrieval model nodes sampled during synthetic buyer intent scans.
          </p>
        </div>
        <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold h-8 px-3">
          <Link href="/dashboard">← Back to Overview</Link>
        </Button>
      </div>

      {/* Desktop Table View (Inspired by Screenshot 3 specs) */}
      <div className="hidden md:block rounded-lg border border-[#e2e4e9] bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#e2e4e9] bg-[#faf9f6] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Engine Name</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Models</th>
              <th className="px-4 py-3">Scan Cadence</th>
              <th className="px-4 py-3">Citation Depth</th>
              <th className="px-4 py-3 text-right">Registry Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e4e9]">
            {engines.map((engine) => (
              <tr key={engine.name} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-950">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{engine.name}</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5 max-w-sm">
                    {engine.retrievalBias}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-slate-950">{engine.score}/100</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{engine.models}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{engine.cadence}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-emerald-700 font-semibold">{engine.citationDepth}</td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                  {engine.indexSource}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {engines.map((engine) => (
          <div key={engine.name} className="rounded-lg border border-[#e2e4e9] bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-950 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{engine.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-950 text-xs">{engine.score}/100</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600">Models: {engine.models}</div>
            <div className="text-[11px] font-mono text-emerald-700 font-semibold">{engine.citationDepth}</div>
            <p className="text-xs text-slate-500 pt-1 border-t border-[#e2e4e9]">{engine.retrievalBias}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
