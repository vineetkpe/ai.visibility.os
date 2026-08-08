import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PageContainer({
  title,
  description,
  action,
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn('flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto w-full', className)}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>}
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
