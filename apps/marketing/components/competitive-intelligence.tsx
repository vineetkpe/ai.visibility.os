'use client';

import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

const competitors = [
  { name: 'Stripe (Your Brand)', sov: 68, citations: 18, sentiment: '96% Positive', status: 'Market Leader' },
  { name: 'Adyen Enterprise', sov: 18, citations: 7, sentiment: '91% Positive', status: 'Primary Challenger' },
  { name: 'Braintree Payments', sov: 9, citations: 4, sentiment: '84% Neutral', status: 'Declining SOV' },
  { name: 'Checkout.com', sov: 5, citations: 2, sentiment: '78% Mixed', status: 'Niche Presence' },
];

const citationGaps = [
  {
    source: 'G2 Spring 2026 Payment Gateway Grid Report',
    type: 'Third-Party Analyst',
    competitorCited: 'Adyen Enterprise',
    yourStatus: 'Missing Citation Node',
    impact: 'High Visibility Risk (-8 SOV points on Perplexity)',
    action: 'Submit updated G2 Enterprise product review schema',
  },
  {
    source: 'TechCrunch Enterprise Fintech Benchmark 2026',
    type: 'Industry Press',
    competitorCited: 'Braintree',
    yourStatus: 'Partial Citation',
    impact: 'Medium Visibility Impact (-4 SOV points on Gemini)',
    action: 'Pitch executive press update on international payout rails',
  },
  {
    source: 'FintechDev GitHub Awesome-List Repository',
    type: 'Developer Community',
    competitorCited: 'Checkout.com',
    yourStatus: 'Missing Citation Node',
    impact: 'High Impact on Developer Query Prompts',
    action: 'Create pull request to add official open-source SDK link',
  },
];

export function CompetitiveIntelligence() {
  const [activeView, setActiveView] = useState<'sov' | 'gaps'>('sov');

  return (
    <section id="competitive" className="border-b border-slate-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-12 border-b border-slate-200 gap-6">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
              05 // Market Benchmarking
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Competitive AI Share of Voice
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-slate-600">
            Uncover exactly why LLMs recommend your competitors over your brand, and identify the source citations you need to capture to dominate your market category.
          </p>
        </div>

        {/* View Toggle */}
        <div className="mt-8 flex justify-center sm:justify-start gap-2">
          <button
            onClick={() => setActiveView('sov')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeView === 'sov'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Share of Voice Comparison
          </button>
          <button
            onClick={() => setActiveView('gaps')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeView === 'gaps'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Citation Gap Matrix (3 Flags)
          </button>
        </div>

        {activeView === 'sov' ? (
          /* Share of Voice Visual Matrix */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: SOV Breakdown Bars */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-[#fafafb] p-6 sm:p-8">
              <span className="font-mono text-xs font-semibold text-slate-500 uppercase">
                Audited Category: Enterprise Payments (2,400 Prompts)
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-950">
                Brand Recommendation Distribution
              </h3>

              <div className="mt-8 space-y-6">
                {competitors.map((item, idx) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={idx === 0 ? 'text-slate-950 font-extrabold' : 'text-slate-700'}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">{item.status}</span>
                        <span className="font-extrabold text-slate-950 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {item.sov}% SOV
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          idx === 0 ? 'bg-slate-950' : 'bg-slate-400'
                        }`}
                        style={{ width: `${item.sov}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Key Findings & Recommendations Card */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <span className="font-mono text-xs font-semibold text-slate-500 uppercase">
                Competitive Gap Analysis
              </span>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                3 Key Source Gaps Costing 14% SOV
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                While your brand leads in ChatGPT and Perplexity, Adyen holds a 32% Share of Voice in European enterprise prompts due to their localized compliance documentation being indexed by Gemini 1.5.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Missing Compliance Citation:</strong> Gemini is pulling Adyen&apos;s PSD2 whitepaper for EU security prompts.
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Strength Advantage:</strong> Your brand maintains a 92% citation rate in developer API comparison queries.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Citation Gap Matrix Table */
          <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-[#fafafb] font-mono uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Missing Source Domain</th>
                    <th className="px-6 py-4">Source Type</th>
                    <th className="px-6 py-4">Currently Citing</th>
                    <th className="px-6 py-4">Estimated Impact</th>
                    <th className="px-6 py-4 text-right">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {citationGaps.map((gap, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-950">{gap.source}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{gap.type}</td>
                      <td className="px-6 py-4 font-semibold text-amber-700 bg-amber-50 rounded">
                        {gap.competitorCited}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{gap.impact}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-200 cursor-pointer">
                          <span>Remediate</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
