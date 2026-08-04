import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/hero';
import { ProblemStatement } from '@/components/marketing/problem-statement';
import { FeaturesSection } from '@/components/marketing/features-section';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { SupportedPlatforms } from '@/components/marketing/supported-platforms';
import { WhyItMatters } from '@/components/marketing/why-it-matters';
import { Benefits } from '@/components/marketing/benefits';
import { PricingPreview } from '@/components/marketing/pricing-preview';
import { FAQ } from '@/components/marketing/faq';
import { CTA } from '@/components/marketing/cta';

export const metadata: Metadata = {
  title: 'AI Visibility OS — Measure, Understand & Improve Your AI Search Visibility',
  description:
    'The operating system for measuring and improving how businesses appear across AI platforms like Gemini, Groq, OpenAI, and Claude.',
  openGraph: {
    title: 'AI Visibility OS — Measure & Improve Your AI Search Visibility',
    description:
      'Analyze your visibility across AI search engines, discover competitor rankings, and receive evidence-based recommendations.',
    url: 'https://aivisibilityos.com',
    siteName: 'AI Visibility OS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Visibility OS — Measure & Improve Your AI Search Visibility',
    description:
      'The operating system for measuring and improving how businesses appear across AI platforms.',
  },
};

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <ProblemStatement />
      <FeaturesSection />
      <HowItWorks />
      <SupportedPlatforms />
      <WhyItMatters />
      <Benefits />
      <PricingPreview />
      <FAQ />
      <CTA />
    </>
  );
}
