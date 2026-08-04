import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white mx-auto shadow-sm">
            <Shield className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to Take Control of Your AI Search Presence?
          </h2>

          <p className="text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Audit your domain citations, discover competitor rankings, and start optimizing for conversational AI platforms today.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-sm px-6 w-full sm:w-auto">
              <Link href="/contact">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
