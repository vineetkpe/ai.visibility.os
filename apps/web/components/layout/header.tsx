'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from './breadcrumb';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  onMenuToggle?: () => void;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export function Header({ onMenuToggle, displayName, avatarUrl, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-13 w-full items-center justify-between border-b border-[#e2e4e9] bg-white px-4 md:px-6 select-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-center space-x-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-900 lg:hidden"
            onClick={onMenuToggle}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <Breadcrumb />
      </div>

      <div className="flex items-center space-x-2.5">
        <Link
          href="/dashboard/scans"
          className="hidden md:flex items-center gap-2 rounded-md border border-[#e2e4e9] bg-[#faf9f6] px-2.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-900 transition-colors"
          aria-label="Open scan history"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-[11px]">Scan history</span>
        </Link>

        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex h-7 items-center gap-1.5 bg-slate-950 px-2.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Link href="/projects/new">
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>New Project</span>
          </Link>
        </Button>

        <Link href="/settings" className="flex items-center gap-2 border-l border-[#e2e4e9] pl-2.5" aria-label="Open account settings">
          {displayName && (
            <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-900 sm:inline-block">
              {displayName}
            </span>
          )}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'User avatar'}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full border border-[#e2e4e9] object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-xs font-bold text-amber-900">
              {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
