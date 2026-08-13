import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — AI Visibility OS',
  description: 'Enterprise Privacy Policy and zero-retention data commitments for AI Visibility OS.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl text-slate-950">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-500">
              Last updated: August 2026 | Version 2.4
            </p>

            <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Data Governance & Zero Retention</h2>
                <p>
                  AI Visibility OS Inc. ("Company", "we", "us") respects your privacy. All synthetic prompts, domain citation scans, and competitor metrics processed by our platform adhere to strict zero-retention policies. We do not sell, rent, or monetize tenant benchmark data.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Information Collection</h2>
                <p>
                  We collect account registration data (name, work email, organization details) and technical telemetry required to deliver our services. Synthetic prompts executed against AI model endpoints are anonymized and stored securely in isolated tenant partitions.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">3. Compliance & Security</h2>
                <p>
                  Our infrastructure is SOC2 Type II certified. All data in transit is encrypted using TLS 1.3, and data at rest is encrypted using AES-256. Tenants may request complete data deletion at any time via the Admin Console.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
