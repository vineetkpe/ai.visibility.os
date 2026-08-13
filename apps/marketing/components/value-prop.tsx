'use client';

import React from 'react';
import { Target, Eye, Database, ShieldAlert, Cpu, Award } from 'lucide-react';

export function ValueProp() {
  return (
    <section id="platform" className="border-b border-slate-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Editorial Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-12 border-b border-slate-200">
          <div className="lg:col-span-7">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
              01 // System Core Capability
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight">
              Traditional SEO measures blue links.{' '}
              <span className="font-serif-headline font-normal text-slate-800">
                We measure AI answers.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base text-slate-600 leading-relaxed">
              When prospective enterprise customers ask LLMs &ldquo;What is the best security platform for fintech?&rdquo; or &ldquo;How does Brand X compare to Brand Y?&rdquo; traditional rank trackers are blind. AI Visibility OS reveals the exact synthetic answers delivered to your buyers.
            </p>
          </div>
        </div>

        {/* 3 Pillar Architectural Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fafafb] p-6 sm:p-8 transition-all hover:border-slate-400 hover:shadow-md">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900 bg-slate-950 text-white mb-6">
                <Eye className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                Pillar 01
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Generative Narrative Control
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Monitor how LLMs describe your products, pricing models, security claims, and feature sets. Instantly flag incorrect statements or negative hallucinations before they impact deal cycles.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Sentiment Tracing</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Active Audit
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fafafb] p-6 sm:p-8 transition-all hover:border-slate-400 hover:shadow-md">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900 bg-slate-950 text-white mb-6">
                <Database className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                Pillar 02
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Ground-Truth Citation Graph
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Discover the exact URLs, documentation pages, industry reviews, and GitHub repositories that AI search engines retrieve when answering questions about your industry category.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Retrieval Context</span>
              <span className="text-slate-900 font-semibold bg-slate-200 px-2 py-0.5 rounded">
                Node Extraction
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fafafb] p-6 sm:p-8 transition-all hover:border-slate-400 hover:shadow-md">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900 bg-slate-950 text-white mb-6">
                <Cpu className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                Pillar 03
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Synthetic Query Indexing
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Automatically generate and execute thousands of high-intent buyer prompts across ChatGPT, Gemini, Claude, and Perplexity to measure your Share of Voice against direct market competitors.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Multi-Engine Audit</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                6 LLM Registries
              </span>
            </div>
          </div>
        </div>

        {/* Quantitative Performance Benchmarks Bar */}
        <div className="mt-16 rounded-xl border border-slate-200 bg-[#fafafb] p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/80">
            <div className="pr-4">
              <span className="text-4xl font-extrabold text-slate-950 font-mono">4.8x</span>
              <span className="mt-2 block text-xs font-semibold text-slate-900">
                Average Citation Growth
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                In primary AI search answers within 60 days of remediation.
              </span>
            </div>

            <div className="px-4">
              <span className="text-4xl font-extrabold text-slate-950 font-mono">99.4%</span>
              <span className="mt-2 block text-xs font-semibold text-slate-900">
                Attribution Accuracy
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Verified source domain matching across all scanned LLM outputs.
              </span>
            </div>

            <div className="px-4">
              <span className="text-4xl font-extrabold text-slate-950 font-mono">14.2M+</span>
              <span className="mt-2 block text-xs font-semibold text-slate-900">
                Prompts Audited Daily
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Continuous synthetic query execution across multi-region nodes.
              </span>
            </div>

            <div className="pl-4">
              <span className="text-4xl font-extrabold text-slate-950 font-mono">&lt; 2.5m</span>
              <span className="mt-2 block text-xs font-semibold text-slate-900">
                Automated Playbook Setup
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Instant generation of JSON-LD schemas and source injection plans.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
