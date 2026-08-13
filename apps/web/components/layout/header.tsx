'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, User, Sparkles, Plus, ArrowUpRight } from 'lucide-react';
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
        className
      )}
      {...props}
    >
      {/* Left side: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7 text-slate-500 hover:text-slate-900"
            onClick={onMenuToggle}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        <Breadcrumb />
      </div>

      {/* Right side: Search + Quick Scan + User Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Command Search Bar Affordance */}
        <div className="hidden md:flex items-center space-x-2 rounded border border-[#e2e4e9] bg-[#faf9f6] px-2.5 py-1 text-xs text-slate-500 hover:border-slate-300 transition-colors cursor-pointer">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-[11px]">Search prompts & scans...</span>
          <kbd className="rounded border border-[#e2e4e9] bg-white px-1 text-[9px] text-slate-500 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Quick Action Button */}
        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold px-2.5 h-7 shadow-2xs"
        >
          <Link href="/projects/new">
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>New Scan</span>
          </Link>
        </Button>

        {/* User Account Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#e2e4e9]">
          {displayName && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-900 truncate max-w-[120px]">
              {displayName}
            </span>
          )}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'User avatar'}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover border border-[#e2e4e9] shadow-2xs"
            />
          ) : (
            <div className="h-7 w-7 flex items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-2xs">
              {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

