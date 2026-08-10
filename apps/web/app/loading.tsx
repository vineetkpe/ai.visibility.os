import React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/70 p-8 backdrop-blur-[2px]"
    >
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    </div>
  );
}
