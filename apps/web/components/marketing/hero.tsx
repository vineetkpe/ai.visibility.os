import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-20 lg:py-28 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-slate-900" />
            <span>Introducing AI Search Engine Visibility OS</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
            Understand How AI Sees Your Business.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Analyze your visibility across AI search engines, discover why competitors appear before
            you, and receive evidence-based recommendations to improve your presence.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto text-sm px-6">
              <Link href="/contact">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-sm px-6">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* Trust points */}
          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-slate-700" />
              <span>Evidence-based Auditing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-slate-700" />
              <span>Multi-Model AI Scanning</span>
            </div>
          </div>
        </div>

        {/* Visual Preview Graphic Placeholder */}
        <div className="mt-14 mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-slate-200" />
              <div className="h-3 w-3 rounded-full bg-slate-200" />
              <div className="h-3 w-3 rounded-full bg-slate-200" />
            </div>
            <div className="text-xs font-mono text-slate-400">
              ai-visibility-scanner // audit workspace
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500">Visibility Score</div>
              <div className="h-5 w-28 rounded-md bg-slate-200/80 animate-pulse" />
              <div className="h-3 w-36 rounded-md bg-slate-100" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500">Citation Presence</div>
              <div className="h-5 w-24 rounded-md bg-slate-200/80 animate-pulse" />
              <div className="h-3 w-32 rounded-md bg-slate-100" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500">Competitor Share of Voice</div>
              <div className="h-5 w-20 rounded-md bg-slate-200/80 animate-pulse" />
              <div className="h-3 w-36 rounded-md bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
