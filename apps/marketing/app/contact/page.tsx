import React from 'react';
import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { ContactForm } from '@/components/contact-form';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Sales & Enterprise Demo — AI Visibility OS',
  description:
    'Schedule an enterprise demo with our GEO specialists or reach our customer success team.',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-[#090d16] selection:bg-amber-100 selection:text-amber-900">
      <Navigation />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Contact Overview */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-900">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                Enterprise Sales & Advisory
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
                Talk to a GEO Strategist
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Discover how AI Visibility OS can help your organization audit synthetic brand prompts, measure citation share, and enforce brand accuracy across LLMs.
              </p>

              <div className="space-y-4 pt-4 text-xs font-mono text-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-600" />
                  <span>enterprise@aivisibilityos.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-600" />
                  <span>+1 (800) 555-GEO1</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>San Francisco, CA — Headquarters</span>
                </div>
              </div>
            </div>

            {/* Right Contact Form (Client Component) */}
            <ContactForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
