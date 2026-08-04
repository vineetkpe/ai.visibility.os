'use client';

import { type ReactNode } from 'react';
import { ReactQueryProvider } from './react-query-provider';
import { ToastProvider } from './toast-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReactQueryProvider>
      {children}
      <ToastProvider />
    </ReactQueryProvider>
  );
}
