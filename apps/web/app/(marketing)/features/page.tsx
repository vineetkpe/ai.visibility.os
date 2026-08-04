import type { Metadata } from 'next';
import { FeaturesSection } from '@/components/marketing/features-section';
import { SupportedPlatforms } from '@/components/marketing/supported-platforms';

export const metadata: Metadata = {
  title: 'Features — AI Visibility OS',
  description: 'Explore the full capabilities of AI Visibility OS.',
};

export default function FeaturesPage() {
  return (
    <div className="py-12 space-y-12">
      <FeaturesSection />
      <SupportedPlatforms />
    </div>
  );
}
