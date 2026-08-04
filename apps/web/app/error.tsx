'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service if needed
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4 border border-red-100">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
        Something went wrong
      </h2>
      
      <p className="text-sm text-slate-500 max-w-md mb-6">
        An unexpected error occurred while rendering this page. You can try refreshing or resetting the component state.
      </p>

      <Button onClick={() => reset()} variant="default" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
