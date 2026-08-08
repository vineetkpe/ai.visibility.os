import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label, className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-slate-200 border-t-slate-900',
          sizeClasses[size]
        )}
      />
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}
