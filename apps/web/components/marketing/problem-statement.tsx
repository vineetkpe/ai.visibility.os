import React from 'react';
import { EyeOff, Search, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ProblemStatement() {
  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            The Paradigm Shift
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Search is shifting from blue links to direct AI answers.
          </p>
          <p className="text-base text-slate-600">
            Traditional SEO metrics no longer tell the full story. When users ask AI models for product or service recommendations, standard analytics miss how your brand is represented.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-200 bg-slate-50/30">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Traditional SEO Blindspots
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keyword rank trackers monitor web SERPs, but fail to measure direct synthetic answers synthesized by conversational LLM systems.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/30">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <EyeOff className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Unseen Competitor Bias
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Competitors may be recommended repeatedly by AI models based on unstructured corpus training or specific authoritative citation sources.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/30">
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Lack of Actionable Evidence
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Without clear citation tracing and sentiment breakdown, marketing teams cannot optimize domain content for AI model retrieval.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
