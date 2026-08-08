import React from 'react';
import { Target, Layers, FileText, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const featureList = [
  {
    icon: Target,
    title: 'Citation & Source Auditing',
    description:
      'Track which domain URLs and external web sources are cited when AI models respond to prompts in your industry.',
  },
  {
    icon: Layers,
    title: 'Competitor Share of Voice',
    description:
      'Compare your brand visibility directly against rival domain names across multiple prompt categories and query intents.',
  },
  {
    icon: FileText,
    title: 'Evidence-Based Recommendations',
    description:
      'Receive structured recommendations prioritizing technical, content, and schema optimizations tailored for AI discovery.',
  },
  {
    icon: Sparkles,
    title: 'Multi-Model Benchmarking',
    description:
      'Evaluate your visibility across major AI engines simultaneously with continuous tracking and score history.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Capabilities
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything needed to audit and elevate your AI presence.
          </p>
          <p className="text-base text-slate-600">
            A comprehensive suite of tools built for modern search visibility and brand
            intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureList.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-slate-200 bg-white shadow-xs">
                <CardHeader className="flex flex-row items-start space-x-4 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
