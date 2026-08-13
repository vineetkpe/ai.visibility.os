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
        'sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 md:px-8 backdrop-blur-xs',
        className
      )}
      {...props}
    >
      {/* Left side: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center space-x-4">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-slate-600 hover:text-slate-900"
            onClick={onMenuToggle}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Breadcrumb />
      </div>

      {/* Right side: Search + Quick Scan + User Profile */}
      <div className="flex items-center space-x-3">
        {/* Command Search Bar Affordance */}
        <div className="hidden md:flex items-center space-x-2.5 rounded-md border border-slate-200 bg-[#faf9f6] px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 transition-colors cursor-pointer">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-[11px]">Search prompts & scans...</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 text-[10px] text-slate-500 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Quick Action Button */}
        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold px-3 h-8 shadow-xs"
        >
          <Link href="/projects/new">
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>New Scan</span>
          </Link>
        </Button>

        {/* User Account Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200/80">
          {displayName && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 truncate max-w-[120px]">
              {displayName}
            </span>
          )}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'User avatar'}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-2xs"
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs shadow-2xs">
              {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

