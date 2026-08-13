import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { PricingCTA } from '@/components/pricing-cta';
import { Footer } from '@/components/footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Enterprise Pricing — AI Visibility OS',
  description:
    'Transparent, scalable enterprise pricing plans for brand audit, continuous AI engine monitoring, and automated GEO remediation.',
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
              Enterprise Plans for Modern Brands
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Scale your generative engine optimization with dedicated LLM prompt scanning, competitor benchmarking, and custom integration SLAs.
            </p>
          </div>
        </section>

        <PricingCTA />
      </main>

      <Footer />
    </div>
  );
}
