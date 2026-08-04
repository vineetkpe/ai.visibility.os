import React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <LoadingSpinner size="lg" label="Loading application..." />
    </div>
  );
}
