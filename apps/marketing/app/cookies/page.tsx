import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Cookie Policy — AI Visibility OS',
  description: 'Understand how AI Visibility OS uses essential telemetry cookies.',
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl text-slate-950">
              Cookie Policy
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-500">
              Last updated: August 2026 | Version 2.4
            </p>

            <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Essential Telemetry Cookies</h2>
                <p>
                  AI Visibility OS uses strict first-party cookies necessary for user authentication, CSRF security verification, and workspace state preservation. We do not use third-party advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Managing Preferences</h2>
                <p>
                  You can configure your browser to block essential cookies, but doing so will prevent you from signing in to the authenticated dashboard application.
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
