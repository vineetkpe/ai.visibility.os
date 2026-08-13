import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { ValueProp } from '@/components/value-prop';
import { RecommendationsWorkflow } from '@/components/recommendations-workflow';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { ArrowRight, Building2, Shield, CreditCard, Cloud } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Industry Solutions — AI Visibility OS',
  description:
    'Tailored generative engine optimization solutions for enterprise B2B SaaS, Fintech, Cloud, and Developer Infrastructure.',
};

export default function SolutionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1">
        {/* Solutions Hero Header */}
        <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-mono text-slate-800 mb-6">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                Industry Tailored GEO
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                GEO Solutions for Industry Leaders
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Whether you manage a multi-billion dollar SaaS portfolio, a compliant financial service, or developer infrastructure, AI Visibility OS protects your brand's AI share of voice.
              </p>
            </div>

            {/* Vertical Cards */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-[#faf9f6] p-6 shadow-xs">
                <Building2 className="h-6 w-6 text-amber-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900">Enterprise B2B SaaS</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Ensure your platform is recommended as the top solution in buyer evaluation prompts.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-[#faf9f6] p-6 shadow-xs">
                <CreditCard className="h-6 w-6 text-amber-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900">Fintech & Banking</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Monitor regulatory accuracy and trust scores in financial advice outputs.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-[#faf9f6] p-6 shadow-xs">
                <Shield className="h-6 w-6 text-amber-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900">Cybersecurity</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Verify threat intelligence and compliance features are accurately cited by AI engines.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-[#faf9f6] p-6 shadow-xs">
                <Cloud className="h-6 w-6 text-amber-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900">Dev & Cloud Infra</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Maintain developer mindshare in code generation and infrastructure recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ValueProp />
        <RecommendationsWorkflow />
      </main>

      <Footer />
    </div>
  );
}
