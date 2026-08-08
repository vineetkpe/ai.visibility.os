import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-slate-200 bg-white animate-pulse',
        className
      )}
      {...props}
    >
      {/* Table Header */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 py-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={`head-${colIndex}`} className="flex-1 px-2">
            <div className="h-4 w-20 rounded-md bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center px-6 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 px-2">
                <div
                  className={cn(
                    'h-3.5 rounded-md bg-slate-100',
                    colIndex === 0 ? 'w-3/4' : 'w-1/2'
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
