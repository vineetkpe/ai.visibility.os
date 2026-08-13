import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { HowItWorks } from '@/components/how-it-works';
import { RecommendationsWorkflow } from '@/components/recommendations-workflow';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'GEO Methodology & Prompt Sampling — AI Visibility OS',
  description:
    'Our scientific framework for synthetic prompt execution, sentiment scoring, citation extraction, and remediation playbooks.',
};

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        {/* Methodology Hero Header */}
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-900 mb-6">
                <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                Scientific Framework
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                Rigorous Prompt Sampling & GEO Science
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Learn how AI Visibility OS simulates real buyer intent, evaluates model context windows, extracts authoritative domain citations, and formulates reproducible optimization playbooks.
              </p>
            </div>
          </div>
        </section>

        <HowItWorks />
        <RecommendationsWorkflow />
      </main>

      <Footer />
    </div>
  );
}
