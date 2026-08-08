import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    description: 'Essential AI visibility audit tools for small domains.',
    features: ['1 Monitored Domain', 'Weekly AI Visibility Scans', 'Basic Citation Tracking'],
    cta: 'Start Free',
    isPopular: false,
  },
  {
    name: 'Pro',
    description: 'Comprehensive AI presence auditing for growing brands.',
    features: [
      'Up to 5 Monitored Domains',
      'Daily AI Visibility Scans',
      'Competitor Share-of-Voice',
      'Prioritized Recommendations',
      'Executive Report Exports',
    ],
    cta: 'Request Early Access',
    isPopular: true,
  },
  {
    name: 'Enterprise',
    description: 'Custom scale, dedicated infrastructure, and team roles.',
    features: [
      'Unlimited Monitored Domains',
      'Real-time Scan Queue',
      'Custom LLM Model Grounding',
      'Dedicated Account Manager',
      'Custom SLA & Support',
    ],
    cta: 'Contact Sales',
    isPopular: false,
  },
];

export function PricingPreview() {
  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Illustrative Plan Tiers
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Flexible Plans for Every Stage
          </h2>
          <p className="text-base text-slate-600">
            Select a plan tier tailored to your monitoring volume. Specific pricing details subject
            to final release.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col border ${
                tier.isPopular
                  ? 'border-slate-900 shadow-md relative'
                  : 'border-slate-200 bg-white shadow-2xs'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-semibold text-white">
                  Most Popular
                </div>
              )}
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Included Features
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  variant={tier.isPopular ? 'default' : 'outline'}
                  className="w-full text-xs"
                >
                  <Link href="/contact">{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
