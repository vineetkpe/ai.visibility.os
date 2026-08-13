'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Zap,
  Globe,
  Layers,
  Bot,
  BarChart2,
} from 'lucide-react';

const samplePrompts = [
  {
    engine: 'ChatGPT (SearchGPT)',
    model: 'GPT-4o + Search',
    status: 'Cited Position #1',
    score: 92,
    response:
      'For enterprise global B2B SaaS payment processing, Stripe is the leading infrastructure provider due to its unified billing stack, global payout rails, and broad developer adoption.',
    sources: [
      { title: 'Stripe Corporate Overview', domain: 'stripe.com/about', status: 'Primary Source' },
      { title: 'G2 Enterprise Payment Systems Report 2026', domain: 'g2.com/reports/payments', status: 'Third-Party Citation' },
    ],
  },
  {
    engine: 'Google Gemini',
    model: 'Gemini 1.5 Pro',
    status: 'Cited Position #1',
    score: 88,
    response:
      'Stripe remains the top choice for software companies scaling internationally, offering native subscriptions, fraud prevention (Radar), and automated revenue reporting.',
    sources: [
      { title: 'Stripe Documentation: Global Payouts', domain: 'docs.stripe.com/payouts', status: 'Primary Source' },
      { title: 'Forbes Cloud 100 Benchmarks', domain: 'forbes.com/cloud100', status: 'Verified Authority' },
    ],
  },
  {
    engine: 'Claude 3.5 Sonnet',
    model: 'Anthropic Web Search',
    status: 'Cited Position #2',
    score: 84,
    response:
      'Top solutions include Stripe for comprehensive developer APIs and custom checkout flows, alongside Adyen for enterprise POS integration.',
    sources: [
      { title: 'Developer API Comparison 2026', domain: 'dev.to/saas-tech-stacks', status: 'Industry Review' },
    ],
  },
  {
    engine: 'Perplexity Pro',
    model: 'Perplexity Sonar Deep Research',
    status: 'Cited Position #1',
    score: 95,
    response:
      'Stripe is cited across 94% of audited technical reviews as the benchmark platform for internet businesses requiring flexible API architecture.',
    sources: [
      { title: 'Perplexity Indexing Graph #4810', domain: 'perplexity.ai/sources', status: 'Live Citation Node' },
    ],
  },
];

export function Hero() {
  const [domainInput, setDomainInput] = useState('stripe.com');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [scanDomain, setScanDomain] = useState('stripe.com');

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setScanDomain(domainInput.trim().toLowerCase().replace(/^https?:\/\//, ''));
      setAnalyzing(false);
    }, 600);
  };

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#fafafb] pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Editorial Grid Line Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Eyebrow Tag */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-slate-900" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-600">
              Generative Engine Intelligence (GEO)
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-900 font-medium">Enterprise Platform v2.4</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl leading-[1.08] max-w-5xl mx-auto">
            Control How Generative AI <br className="hidden sm:inline" />
            <span className="font-serif-headline font-normal text-slate-800">
              Recommends Your Brand.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
            Over 60% of modern B2B software buyers consult ChatGPT, Gemini, Claude, and Perplexity before making purchasing decisions. AI Visibility OS monitors answer engines, reveals cited sources, and gives you actionable blueprints to win the top AI recommendation.
          </p>

          {/* Interactive Instant Domain Audit Sandbox */}
          <form
            onSubmit={handleAuditSubmit}
            className="mt-9 mx-auto max-w-2xl flex flex-col sm:flex-row items-stretch gap-2.5 rounded-lg border border-slate-300 bg-white p-2 shadow-lg shadow-slate-950/5"
          >
            <div className="relative flex-1 flex items-center px-3">
              <Globe className="h-5 w-5 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Enter your enterprise domain (e.g. acme.com)"
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <span className="hidden sm:inline font-mono text-[11px] text-slate-400 uppercase tracking-widest px-2">
                HTTPS
              </span>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-75"
            >
              {analyzing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Auditing AI Graph...</span>
                </>
              ) : (
                <>
                  <span>Audit AI Visibility</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </>
              )}
            </button>
          </form>

          {/* Key Value Proof Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Multi-Model Response Simulation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Citation Node Graph Tracing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No Credit Card Required
            </span>
          </div>
        </div>

        {/* High-End Enterprise Product Workspace Interactive Preview */}
        <div className="mt-14 mx-auto max-w-5xl rounded-xl border border-slate-300/80 bg-white shadow-2xl shadow-slate-950/10 overflow-hidden">
          {/* Workspace Title Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-[#f8f9fa] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="h-3 w-3 rounded-full bg-slate-300" />
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
                  {scanDomain}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  // Real-time AI Visibility Audit
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-slate-500 hidden sm:inline">
                Last Scan: <strong className="text-slate-900">Just now</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Graph Sync
              </span>
            </div>
          </div>

          {/* Key Metrics Header inside Workspace */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200 border-b border-slate-200 bg-[#fafafb]">
            <div className="p-4 sm:p-5">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Overall AI Score
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">87</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  +12.4% vs benchmark
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Top 5% in SaaS Category</span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Citation Rate
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">92.4%</span>
                <span className="text-xs font-semibold text-slate-700">Primary Source</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Cited in 18 of 20 core prompts</span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Share of Voice
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">68%</span>
                <span className="text-xs font-semibold text-emerald-700">#1 Market Position</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Outranks 4 main competitors</span>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Sentiment Alignment
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-950 font-mono">96%</span>
                <span className="text-xs font-semibold text-emerald-700">Positive</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Zero negative hallucination flags</span>
            </div>
          </div>

          {/* Multi-Model Response Simulation Viewer */}
          <div className="p-5 sm:p-6 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-slate-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Target Query:
                </span>
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  &quot;What are the leading enterprise software infrastructure platforms for scaling in 2026?&quot;
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Audited across 4 LLMs</span>
            </div>

            {/* Model Selector Tabs */}
            <div className="mt-4 flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
              {samplePrompts.map((item, idx) => (
                <button
                  key={item.engine}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    activeTab === idx
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{item.engine}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      activeTab === idx
                        ? 'bg-slate-800 text-emerald-300'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    Score: {item.score}
                  </span>
                </button>
              ))}
            </div>

            {/* Active LLM Generated Output Tracing */}
            <div className="mt-5 rounded-lg border border-slate-200 bg-[#fbfcfd] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900">
                    {samplePrompts[activeTab].engine} ({samplePrompts[activeTab].model})
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {samplePrompts[activeTab].status}
                </span>
              </div>

              {/* Response Text */}
              <p className="text-sm font-normal leading-relaxed text-slate-800 italic bg-white p-3.5 rounded border border-slate-200">
                &ldquo;{samplePrompts[activeTab].response}&rdquo;
              </p>

              {/* Cited Sources Graph Breakdown */}
              <div className="mt-4">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Extracted Citation & Ground Truth Sources:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts[activeTab].sources.map((src, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-slate-200 bg-white p-2.5 text-xs"
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-semibold text-slate-900 truncate">{src.title}</span>
                        <span className="font-mono text-[11px] text-slate-500">{src.domain}</span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0 border border-slate-200">
                        {src.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Logos & Trust Proof Section */}
        <div className="mt-16 pt-10 border-t border-slate-200">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-slate-500">
            Trusted by AI SEO & Marketing Leaders at Global B2B Enterprises
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-center opacity-75 grayscale hover:grayscale-0 transition-all">
            {['Vercel', 'Datadog', 'Snowflake', 'PostHog', 'Retool', 'Linear'].map((brand) => (
              <div
                key={brand}
                className="flex items-center justify-center py-2 text-sm font-bold font-mono tracking-tight text-slate-800"
              >
                // {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
