import React from 'react';
import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getScanDetailsData } from './actions';
import { ScanDetailsClientView } from './scan-details-client-view';

export const metadata = {
  title: 'Scan Details & Insights | AI Visibility OS',
  description: 'Grounded narrative analysis of AI search engine prompt evaluations.',
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
    <PageContainer
      title="Scan Results & Insights"
      description="Narrative proof, actionable recommendations, and underlying evidence for this evaluation scan."
    >
      <ScanDetailsClientView data={result.data} />
    </PageContainer>
  );
}
