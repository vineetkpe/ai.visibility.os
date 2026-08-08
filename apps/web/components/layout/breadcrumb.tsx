'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate fallback breadcrumbs from pathname if items prop not passed
  const generatedItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items) return items;
    if (!pathname || pathname === '/') return [{ label: 'Dashboard' }];

    const segments = pathname.split('/').filter(Boolean);
    return [
      { label: 'Dashboard', href: '/' },
      ...segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
        return { label, href };
      }),
    ];
  }, [items, pathname]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-slate-500', className)}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {generatedItems.map((item, index) => {
          const isLast = index === generatedItems.length - 1;
          return (
            <li key={index} className="inline-flex items-center space-x-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-medium text-slate-900 truncate max-w-[160px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-500 hover:text-slate-900 transition-colors truncate max-w-[160px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
