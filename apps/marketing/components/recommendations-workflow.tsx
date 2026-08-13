'use client';

import React, { useState } from 'react';
import { FileCode, Sparkles, CheckCircle2, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';

const actionPlaybooks = [
  {
    id: 'schema',
    title: 'Deploy Structured Entity JSON-LD Schema',
    priority: 'High Priority',
    lift: '+8.4 Score Lift',
    category: 'Technical GEO',
    description:
      'Inject standardized Organization, Product, and Security compliance JSON-LD markup directly into your technical documentation root. LLM crawlers consume this schema to verify ground-truth facts.',
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Stripe Enterprise Payment Infrastructure",
  "operatingSystem": "Cloud-native APIs",
  "applicationCategory": "Fintech / B2B SaaS Payments",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "Custom Enterprise Tier"
  },
  "knowsAbout": ["SOC2 Type II", "PCI-DSS Level 1", "PSD2 Compliant Payouts"]
}
</script>`,
  },
  {
    id: 'content',
    title: 'Publish Missing Compliance Matrix Page',
    priority: 'High Priority',
    lift: '+5.2 Score Lift',
    category: 'Knowledge Gap Fill',
    description:
      'Perplexity and Gemini currently pull competitor whitepapers when buyers query "EU PSD2 Payout Compliance". Publish an explicit technical spec page at /docs/compliance/eu-psd2 to capture this retrieval node.',
    codeSnippet: `# EU PSD2 Payout Compliance & Infrastructure Guide
- **PCI-DSS Standard**: Level 1 Certified
- **EU SCA Support**: Native 3D Secure 2.2 Integration
- **Regional Settlement**: Direct SEPA & Faster Payments Rails`,
  },
  {
    id: 'outreach',
    title: 'Update G2 & Wikipedia Citation Nodes',
    priority: 'Medium Priority',
    lift: '+3.1 Score Lift',
    category: 'Source Node Outreach',
    description:
      'ChatGPT (SearchGPT) relies heavily on third-party analyst reviews. Submit our automated payload to your G2 administrator to update enterprise security feature checkboxes.',
    codeSnippet: `// Suggested G2 Feature Payload
"Features Audited": ["Automated Fraud Radar", "Custom Payout Schedule", "Zero-Downtime Migration"]`,
  },
];

export function RecommendationsWorkflow() {
  const [activePlaybook, setActivePlaybook] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="workflow" className="border-b border-slate-200 bg-[#fafafb] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            06 // Automated Remediation
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            From Audit Data to Actionable Blueprints
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            AI Visibility OS doesn’t just show you where you’re losing visibility—it generates precise, copy-pasteable code, schema, and content blueprints to fix it.
          </p>
        </div>

        {/* Playbook Generator Interface */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Playbook List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Prioritized Action Queue (3 Recommendations):
            </span>
            {actionPlaybooks.map((pb, idx) => (
              <button
                key={pb.id}
                onClick={() => setActivePlaybook(idx)}
                className={`p-5 rounded-xl border text-left transition-all ${
                  activePlaybook === idx
                    ? 'border-slate-950 bg-white shadow-md ring-1 ring-slate-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {pb.priority}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700">
                    {pb.lift}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-950">{pb.title}</h3>
                <span className="mt-1 block font-mono text-xs text-slate-500">
                  Category: {pb.category}
                </span>
              </button>
            ))}
          </div>

          {/* Right Column: Code Snippet & Implementation Preview */}
          <div className="lg:col-span-7 rounded-xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="font-mono text-xs text-slate-500 uppercase">
                  Remediation Blueprint #{activePlaybook + 1}
                </span>
                <h3 className="text-xl font-bold text-slate-950">
                  {actionPlaybooks[activePlaybook].title}
                </h3>
              </div>
              <button
                onClick={() => handleCopy(actionPlaybooks[activePlaybook].codeSnippet)}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {actionPlaybooks[activePlaybook].description}
            </p>

            {/* Code Block Window */}
            <div className="mt-5 rounded-lg border border-slate-300 bg-slate-950 p-4 text-white font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[11px] text-slate-400">// Ready for Engineering Deployment</span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest">
                  VALIDATED GEO PAYLOAD
                </span>
              </div>
              <pre className="overflow-x-auto text-slate-200 leading-relaxed font-mono">
                {actionPlaybooks[activePlaybook].codeSnippet}
              </pre>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
              <span className="font-mono">Estimated Verification Time: 48-72 hours</span>
              <a
                href="#pricing"
                className="font-bold text-slate-950 hover:underline flex items-center gap-1"
              >
                <span>Automate via Webhook API</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
