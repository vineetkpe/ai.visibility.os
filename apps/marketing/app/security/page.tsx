import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { TrustSecurity } from '@/components/trust-security';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Security & Trust Center — AI Visibility OS',
  description:
    'Enterprise security standards, zero-retention audit infrastructure, and data privacy controls.',
};

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
              Enterprise Trust & Security Infrastructure
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Built with zero-retention guarantees, enterprise security standards, and isolated tenant environments.
            </p>
          </div>
        </section>

        <TrustSecurity />
      </main>

      <Footer />
    </div>
  );
}
