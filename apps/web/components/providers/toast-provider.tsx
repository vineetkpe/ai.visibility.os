'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      theme="light"
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        },
      }}
    />
  );
}
