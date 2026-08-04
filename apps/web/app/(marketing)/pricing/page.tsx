import type { Metadata } from 'next';
import { PricingPreview } from '@/components/marketing/pricing-preview';

export const metadata: Metadata = {
  title: 'Pricing Preview — AI Visibility OS',
  description: 'Illustrative plan overview for AI Visibility OS monitoring tiers.',
};

export default function PricingPage() {
  return (
    <div className="py-12">
      <PricingPreview />
    </div>
  );
}
