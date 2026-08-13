'use client';

import React, { useState } from 'react';
import {
  Search,
  Cpu,
  Share2,
  FileCode2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Terminal,
  Database,
} from 'lucide-react';

const methodologySteps = [
  {
    phase: '01',
    title: 'Synthetic Query Matrix Generation',
    tagline: 'Index every natural query enterprise buyers ask AI systems',
    icon: Search,
    detail:
      'We automatically construct tens of thousands of natural buyer queries using category semantics, competitor names, enterprise requirements, and pricing inquiries.',
    outputLabel: 'Generated Prompt Matrix',
    outputSample: [
      '"What are the best enterprise SOC2 compliant API gateways?"',
      '"Stripe vs Adyen vs Braintree security compliance for fintech"',
      '"Which AI search optimization platform offers live citation graphs?"',
    ],
  },
  {
    phase: '02',
    title: 'Multi-Engine LLM Sampling',
    tagline: 'Continuous API & headless web retrieval orchestration',
    icon: Cpu,
    detail:
      'Our distributed scanner routes queries simultaneously across ChatGPT (OpenAI Search), Google Gemini, Claude, Perplexity Pro, and Microsoft Copilot across multiple geographic regions.',
    outputLabel: 'Live API Provider Registry',
    outputSample: [
      'Gemini 1.5 Pro // Latency: 420ms // Web Grounding: Active',
      'ChatGPT SearchGPT // Latency: 610ms // Citation Nodes: 4',
      'Claude 3.5 Sonnet // Latency: 380ms // Sources Parsed: 6',
    ],
  },
  {
    phase: '03',
    title: 'Citation Node Graph Extraction',
    tagline: 'Deep semantic parsing of retrieved web sources & footnotes',
    icon: Share2,
    detail:
      'We parse inline link citations, footnote references, and implicit brand mentions. We trace which external domains are powering the AI model’s knowledge context.',
    outputLabel: 'Extracted Ground Truth Graph',
    outputSample: [
      'Primary Citation Node -> docs.stripe.com/security [Trust Score: 98/100]',
      'Third-Party Review Node -> g2.com/reports/api-gateways [Trust Score: 88/100]',
      'Missing Source Gap -> competitor-whitepaper.pdf [Opportunity Flag]',
    ],
  },
  {
    phase: '04',
    title: 'Automated Remediation Blueprints',
    tagline: 'Actionable code, schema, and content injection instructions',
    icon: FileCode2,
    detail:
      'The platform generates ready-to-deploy JSON-LD structured metadata, technical documentation updates, and targeted outreach lists to capture missing AI citations.',
    outputLabel: 'Generated GEO Playbook',
    outputSample: [
      'Inject Organization & Product schema snippet into /developers',
      'Publish comparison matrix targeting missing Perplexity prompt #401',
      'Update Wikipedia & G2 listing metadata for LLM ingestion',
    ],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="border-b border-slate-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-12 border-b border-slate-200 gap-6">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
              03 // Technical Methodology
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              How AI Visibility OS Works
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-slate-600">
            Four automated engineering stages transform raw AI answer outputs into structured, evidence-based brand growth strategies.
          </p>
        </div>

        {/* 4 Step Timeline Switcher */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step Selector Column */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {methodologySteps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.phase}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                      : 'border-slate-200 bg-[#fafafb] text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${
                      isSelected
                        ? 'border-slate-700 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    {step.phase}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-snug">{step.title}</h3>
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Step Visualizer */}
          <div className="lg:col-span-7 rounded-xl border border-slate-300 bg-[#fbfcfd] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-700" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                  Stage {methodologySteps[activeStep].phase} Pipeline Output
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                Automated Execution
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-950">
              {methodologySteps[activeStep].title}
            </h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {methodologySteps[activeStep].detail}
            </p>

            {/* Terminal Code Preview */}
            <div className="mt-6 rounded-lg border border-slate-300 bg-slate-950 p-4 text-white font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[11px] text-slate-400">
                  // {methodologySteps[activeStep].outputLabel}
                </span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest">
                  STATUS: OK
                </span>
              </div>
              <div className="space-y-2">
                {methodologySteps[activeStep].outputSample.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none">&gt;</span>
                    <span className="text-slate-200 leading-relaxed">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 text-xs font-mono text-slate-500">
              <span>Next Phase Pipeline</span>
              <button
                onClick={() =>
                  setActiveStep((prev) => (prev + 1) % methodologySteps.length)
                }
                className="flex items-center gap-1 font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>Advance to Step {((activeStep + 1) % 4) + 1}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
