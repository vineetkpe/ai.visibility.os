import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { CompetitiveIntelligence } from '@/components/competitive-intelligence';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Competitive Intelligence & Share of Voice — AI Visibility OS',
  description:
    'Benchmark your AI citation rate, sentiment share, and prompt wins against your primary market competitors.',
};

export default function CompetitiveIntelligencePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-900 mb-6">
                <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
                Market Benchmarking
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                AI Share of Voice & Competitor Analysis
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Understand exactly how often ChatGPT, Claude, Gemini, and Perplexity recommend your competitors instead of your brand—and why.
              </p>
              <div className="mt-8">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
                >
                  <span>Start Competitive Audit</span>
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <CompetitiveIntelligence />
      </main>

      <Footer />
    </div>
  );
}
