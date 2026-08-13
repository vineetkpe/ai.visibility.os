import type { Metadata } from 'next';
import { LandingPage } from '@/components/marketing/landing-page';

export const metadata: Metadata = {
  title: 'AI Visibility OS — Be the answer AI recommends',
  description:
    'Measure how AI systems see your brand, understand why you are being cited, and turn visibility findings into a prioritized growth plan.',
};

export default function HomePage() {
  return <LandingPage />;
}
