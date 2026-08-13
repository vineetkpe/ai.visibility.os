import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Terms of Service — AI Visibility OS',
  description: 'Enterprise Terms of Service governing the use of AI Visibility OS services.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl text-slate-950">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-500">
              Last updated: August 2026 | Version 2.4
            </p>

            <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Agreement to Terms</h2>
                <p>
                  By accessing or using AI Visibility OS, you agree to be bound by these Enterprise Terms of Service. If you are entering into this agreement on behalf of a company, you represent that you have authority to bind that entity.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Service License & Usage Scope</h2>
                <p>
                  We grant you a non-exclusive, non-transferable subscription to access and use the platform for monitoring brand presence across AI search engines. You agree not to reverse engineer or overload our synthetic prompt infrastructure.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">3. Service Level Commitment</h2>
                <p>
                  Enterprise plans include a 99.9% uptime SLA for prompt monitoring and analytics pipelines. Scheduled maintenance windows will be communicated at least 48 hours in advance.
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
