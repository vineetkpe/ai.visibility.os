import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { VisibilityScore } from '@/components/visibility-score';
import { EngineCoverage } from '@/components/engine-coverage';
import { AnalyticsReport } from '@/components/analytics-report';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, BarChart3, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Architecture — AI Visibility OS',
  description:
    'Discover the enterprise platform built to audit, monitor, and optimize your brand representation across LLM search engines.',
};

export default function PlatformPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-900 mb-6">
                <Cpu className="h-3.5 w-3.5 text-amber-600" />
                Enterprise GEO Platform
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                The Operating System for Generative Engine Optimization
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                AI Visibility OS continually monitors synthetic prompt execution, measures engine citation share, and delivers precision action playbooks to govern how AI models answer questions about your brand.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
                >
                  <span>Explore Platform Tier</span>
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </Link>
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <span>Read Methodology</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Components */}
        <VisibilityScore />
        <EngineCoverage />
        <AnalyticsReport />
      </main>

      <Footer />
    </div>
  );
}
