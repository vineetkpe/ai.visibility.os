'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Search, User } from 'lucide-react';
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
        'sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur-xs',
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
            className="lg:hidden h-9 w-9 text-slate-600"
            onClick={onMenuToggle}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Breadcrumb />
      </div>

      {/* Right side: Search placeholder + User Profile */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          <span>Search resources...</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 text-[10px] text-slate-500 font-mono">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center space-x-2">
          {displayName && (
            <span className="hidden sm:inline-block text-sm font-medium text-slate-700">
              {displayName}
            </span>
          )}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'User avatar'}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
