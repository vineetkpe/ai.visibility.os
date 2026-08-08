import React from 'react';
import { ShieldCheck, TrendingUp, Compass } from 'lucide-react';

export function WhyItMatters() {
  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Why AI Visibility Matters
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI is becoming the first touchpoint for customer research.
          </p>
          <p className="text-base text-slate-600">
            When buyers ask AI assistants for software comparisons or vendor recommendations, your
            brand’s inclusion determines whether you enter the consideration set.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Zero-Click Discovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Users get complete answers inside AI interfaces without clicking through multiple
              search results. Citation placement is key.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Brand Narrative Control</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Audit how AI systems summarize your key features, pricing model, and competitive
              advantages to ensure accurate representation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Competitive Displacement</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Identify where competitors are recommended ahead of you and implement targeted content
              optimizations to claim rank position.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
