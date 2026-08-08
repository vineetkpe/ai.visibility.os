import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from './card';

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasFooter?: boolean;
}

export function SkeletonCard({ hasFooter = true, className, ...props }: SkeletonCardProps) {
  return (
    <Card className={cn('animate-pulse', className)} {...props}>
      <CardHeader className="space-y-2">
        <div className="h-4 w-1/3 rounded-md bg-slate-200" />
        <div className="h-3 w-1/2 rounded-md bg-slate-100" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-8 w-full rounded-md bg-slate-100" />
        <div className="h-4 w-4/5 rounded-md bg-slate-100" />
      </CardContent>
      {hasFooter && (
        <CardFooter className="pt-2">
          <div className="h-8 w-24 rounded-md bg-slate-200" />
        </CardFooter>
      )}
    </Card>
  );
}
