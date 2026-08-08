import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-4 border border-slate-200">
        <FileQuestion className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Page Not Found</h2>

      <p className="text-sm text-slate-500 max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>

      <Button asChild variant="default" className="gap-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
