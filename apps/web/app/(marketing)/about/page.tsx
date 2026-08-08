import type { Metadata } from 'next';
import { WhyItMatters } from '@/components/marketing/why-it-matters';

export const metadata: Metadata = {
  title: 'About — AI Visibility OS',
  description: 'Learn about the mission and architecture of AI Visibility OS.',
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          About AI Visibility OS
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          AI Visibility OS is engineered to give marketing leaders, SEO strategists, and brand
          managers clear visibility into how their business is represented across conversational AI
          platforms.
        </p>
      </div>

      <WhyItMatters />
    </div>
  );
}
