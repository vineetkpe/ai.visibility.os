'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

export function PricingCTA() {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <section id="pricing" className="border-b border-slate-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            09 // Transparent Enterprise Investment
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Designed for Serious B2B Growth
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Choose the visibility auditing tier built for your brand size. All plans include continuous multi-model scanning and evidence-based citation blueprints.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-300 bg-[#fafafb] p-1.5 text-xs font-bold">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`rounded-full px-4 py-2 transition-all ${
                !annualBilling ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all ${
                annualBilling ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Growth */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fafafb] p-8 shadow-sm transition-all hover:border-slate-400">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">Growth</span>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-950">Growth Audit Tier</h3>
              <p className="mt-2 text-xs text-slate-600">
                Ideal for mid-market SaaS brands establishing initial AI search presence.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950 font-mono">
                  ${annualBilling ? '390' : '490'}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 3 Enterprise Domains</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>2,500 Synthetic Buyer Prompts / Mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>4 AI Engines (ChatGPT, Gemini, Claude, Perplexity)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Weekly Citation Audit Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard GEO Schema Generator</span>
                </div>
              </div>
            </div>

            <a
              href="https://app.aivisibilityos.com/signup"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md border border-slate-950 bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50 transition-all"
            >
              <span>Start Growth Audit</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Tier 2: Scale (Featured) */}
          <div className="relative flex flex-col justify-between rounded-xl border-2 border-slate-950 bg-white p-8 shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-slate-950 bg-slate-950 px-3 py-1 font-mono text-[11px] font-bold text-white uppercase tracking-wider">
              Most Popular Choice
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-slate-900 uppercase">Scale Tier</span>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-950">Scale & Competition</h3>
              <p className="mt-2 text-xs text-slate-600">
                For category leaders expanding recommendation Share of Voice against rivals.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950 font-mono">
                  ${annualBilling ? '1,160' : '1,450'}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-950">Up to 15 Enterprise Domains</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-950">10,000 Synthetic Buyer Prompts / Mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>All 6 AI Engines (+ Copilot & Meta AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Competitive Share of Voice Matrix</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Automated Remediation Blueprints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>REST API & Webhook Export Integration</span>
                </div>
              </div>
            </div>

            <a
              href="https://app.aivisibilityos.com/signup"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 py-3 text-sm font-semibold text-white hover:bg-slate-800 shadow-md transition-all active:scale-[0.99]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </a>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fafafb] p-8 shadow-sm transition-all hover:border-slate-400">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">Enterprise</span>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-950">Custom Enterprise</h3>
              <p className="mt-2 text-xs text-slate-600">
                Tailored for Fortune 500 organizations requiring custom proxy sandboxing and SLAs.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950 font-mono">
                  ${annualBilling ? '3,360' : '4,200'}
                </span>
                <span className="text-xs text-slate-500 font-mono">+ / month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Brand Domains & Subsidiaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Custom Synthetic Prompt Matrix Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero-Retention Private Proxy Subnet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>99.9% Uptime SLA & Custom Contract Terms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dedicated AI Visibility Strategist</span>
                </div>
              </div>
            </div>

            <a
              href="https://app.aivisibilityos.com/signup"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md border border-slate-950 bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50 transition-all"
            >
              <span>Schedule Enterprise Briefing</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* High-Converting Executive CTA Banner */}
        <div className="mt-20 rounded-xl border border-slate-950 bg-slate-950 p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Executive Strategy Session
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Ready to Own Your Market Category in AI Search?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Get a comprehensive 30-page AI Visibility & Citation Audit Report for your enterprise brand prepared by our intelligence team within 24 hours.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <a
                href="https://app.aivisibilityos.com/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100 transition-all shadow-md"
              >
                <span>Request Executive Audit</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
