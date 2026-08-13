import React from 'react';
import { notFound } from 'next/navigation';
import { getScanDetailsData } from './actions';
import { ScanDetailsClientView } from './scan-details-client-view';

export const metadata = {
  title: 'Scan Results & Insights | AI Visibility OS',
  description: 'Evidence-led visibility analysis, recommendations, and supporting source data.',
};

interface ScanDetailsPageProps {
  params: Promise<{
    scanId: string;
  }>;
}

export default async function ScanDetailsPage({ params }: ScanDetailsPageProps) {
  const { scanId } = await params;
  const result = await getScanDetailsData(scanId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#fafafa]">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ScanDetailsClientView data={result.data} />
      </div>
    </main>
  );
}
