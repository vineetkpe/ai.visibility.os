import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { AnalyticsReport } from '@/components/analytics-report';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources & Knowledge Center — AI Visibility OS',
  description:
    'Research reports, GEO whitepapers, case studies, and brand visibility optimization guides.',
};

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-mono text-slate-800 mb-6">
                <FileText className="h-3.5 w-3.5 text-slate-600" />
                GEO Knowledge Center
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                GEO Insights, Benchmarks & Reports
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Explore empirical research on LLM retrieval algorithms, citation indexing mechanisms, and practical playbooks for marketing executives.
              </p>
            </div>
          </div>
        </section>

        <AnalyticsReport />
      </main>

      <Footer />
    </div>
  );
}
