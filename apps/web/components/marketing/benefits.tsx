import React from 'react';
import { Check } from 'lucide-react';

const benefitsList = [
  'Continuous monitoring across major AI search engines',
  'Automated detection of cited source URLs',
  'Competitor share-of-voice benchmarking',
  'Sentiment and brand perception scoring',
  'Actionable, prioritized optimization tasks',
  'Exportable PDF & HTML executive reports',
];

export function Benefits() {
  return (
    <section className="py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Measurable Benefits
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Built for modern SEO & marketing leaders.
          </p>
        </div>

        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefitsList.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium text-slate-800">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
