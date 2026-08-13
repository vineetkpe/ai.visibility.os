import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — AI Visibility OS',
  description: 'Acceptable Use Guidelines for AI Visibility OS GEO sampling and API endpoints.',
};

export default function AcceptableUsePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl text-slate-950">
              Acceptable Use Policy
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-500">
              Last updated: August 2026 | Version 2.4
            </p>

            <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Permitted Activities</h2>
                <p>
                  Subscribers may use the AI Visibility OS platform to monitor, benchmark, and optimize synthetic prompt executions for legitimate brand management, competitive intelligence, and executive reporting.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Prohibited Uses</h2>
                <p>
                  You may not use the platform to generate misleading or deceptive content intended to manipulate AI retrieval algorithms maliciously, launch DDoS attacks against AI provider endpoints, or scrape platform proprietary benchmarking data.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
