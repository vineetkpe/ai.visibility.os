import React from 'react';
import { Navigation } from '@/components/navigation';
import { Hero } from '@/components/hero';
import { ValueProp } from '@/components/value-prop';
import { VisibilityScore } from '@/components/visibility-score';
import { HowItWorks } from '@/components/how-it-works';
import { EngineCoverage } from '@/components/engine-coverage';
import { CompetitiveIntelligence } from '@/components/competitive-intelligence';
import { RecommendationsWorkflow } from '@/components/recommendations-workflow';
import { AnalyticsReport } from '@/components/analytics-report';
import { TrustSecurity } from '@/components/trust-security';
import { PricingCTA } from '@/components/pricing-cta';
import { Footer } from '@/components/footer';

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafb] text-[#090d16] selection:bg-[#090d16] selection:text-white">
      {/* 1. Navigation */}
      <Navigation />

      <main className="flex-1">
        {/* 2. Hero */}
        <Hero />

        {/* 3. Product / Value Proposition */}
        <ValueProp />

        {/* 4. AI Visibility Score Visualization */}
        <VisibilityScore />

        {/* 5. How It Works Methodology */}
        <HowItWorks />

        {/* 6. AI Engine Coverage */}
        <EngineCoverage />

        {/* 7. Competitive Intelligence */}
        <CompetitiveIntelligence />

        {/* 8. Recommendations / Action Workflow */}
        <RecommendationsWorkflow />

        {/* 9. Example Analytics / Report Section */}
        <AnalyticsReport />

        {/* 10. Trust / Security Section */}
        <TrustSecurity />

        {/* 11. Pricing / CTA Section */}
        <PricingCTA />
      </main>

      {/* 12. Professional Footer */}
      <Footer />
    </div>
  );
}
