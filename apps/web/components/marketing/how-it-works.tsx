import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Configure Project & Domains',
    description:
      'Input your domain names, target industry keywords, and key competitors to establish your monitoring workspace.',
  },
  {
    step: '02',
    title: 'Execute Multi-Model AI Scans',
    description:
      'Run benchmark scans across AI search engines to measure citations, sentiment ratings, and recommendation placements.',
  },
  {
    step: '03',
    title: 'Receive Evidence-Based Insights',
    description:
      'Review actionable optimization tasks and citation analysis to improve your brand presence across AI platforms.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 bg-white border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            How It Works
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Three simple steps to master AI search visibility.
          </p>
          <p className="text-base text-slate-600">
            Designed for seamless integration into your existing search & content workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-8"
            >
              <span className="text-4xl font-extrabold text-slate-300 mb-4 font-mono">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
