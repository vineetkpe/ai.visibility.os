import React from 'react';
import { Navigation } from '@/components/navigation';
import { Hero } from '@/components/hero';
import { ValueProp } from '@/components/value-prop';
import { VisibilityScore } from '@/components/visibility-score';
import { EngineCoverage } from '@/components/engine-coverage';
import { CompetitiveIntelligence } from '@/components/competitive-intelligence';
import { RecommendationsWorkflow } from '@/components/recommendations-workflow';
import { TrustSecurity } from '@/components/trust-security';
import { PricingCTA } from '@/components/pricing-cta';
import { Footer } from '@/components/footer';

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Navigation */}
      <Navigation />

      <main className="flex-1">
        {/* 2. Conversion Hero */}
        <Hero />

        {/* 3. Value Proposition */}
        <ValueProp />

        {/* 4. Core Metric: AI Visibility Score */}
        <VisibilityScore />

        {/* 5. Engine Coverage */}
        <EngineCoverage />

        {/* 6. Competitive Intelligence Showcase */}
        <CompetitiveIntelligence />

        {/* 7. Action Playbook Workflow */}
        <RecommendationsWorkflow />

        {/* 8. Enterprise Trust & Security */}
        <TrustSecurity />

        {/* 9. Conversion CTA & Pricing Tier */}
        <PricingCTA />
      </main>

      {/* 10. Professional Enterprise Footer */}
      <Footer />
    </div>
  );
}

