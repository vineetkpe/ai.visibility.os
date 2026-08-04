import React, { type ReactNode } from 'react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { StructuredData } from '@/components/marketing/structured-data';

export interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <StructuredData />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
