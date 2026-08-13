'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scan, Building, Lightbulb, Settings, Shield, ShieldAlert, X, Plus, Sparkles, FolderKanban, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
  onClose?: () => void;
  isAdmin?: boolean;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Scan History', href: '/dashboard/scans', icon: Scan },
  { label: 'Recommendations', href: '/recommendations', icon: Lightbulb },
  { label: 'Competitors', href: '/competitors', icon: Building },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen = false, onClose, isAdmin = false, className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        {...props}
      >
        {/* Workspace Identity Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/80 bg-[#faf9f6]">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-900 bg-slate-950 text-white shadow-xs group-hover:bg-slate-900 transition-colors">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 text-sm tracking-tight leading-none">
                AI Visibility OS
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">
                Enterprise v2.4
              </span>
            </div>
          </Link>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-500 hover:text-slate-900"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Primary Action & Workspace Indicator */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="mb-3 rounded-lg border border-slate-200/80 bg-[#faf9f6] p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
              <span>WORKSPACE</span>
              <span className="text-amber-700 font-semibold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 truncate">
                Main Brand Portfolio
              </span>
              <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
          </div>

          <Button
            asChild
            className="w-full justify-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-xs border border-amber-600/30 text-xs h-9"
          >
            <Link href="/projects/new" onClick={onClose}>
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Brand Project</span>
            </Link>
          </Button>
        </div>

        {/* Main Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Platform Modules
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center space-x-3 rounded-md px-3 py-2 text-xs font-medium transition-all relative',
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-amber-400' : 'text-slate-400'
                      )}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Privileged Access Navigation (If Admin) */}
          {isAdmin && (
            <div>
              <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-600" />
                Administration
              </p>
              <nav className="space-y-1">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold border transition-all',
                    pathname.startsWith('/admin')
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:bg-amber-100/80'
                  )}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Admin Operations</span>
                  </div>
                  <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[9px] font-mono uppercase text-amber-900 font-bold">
                    Console
                  </span>
                </Link>
              </nav>
            </div>
          )}

          {/* Engine Status Callout */}
          <div className="mx-1 rounded-md border border-slate-200/70 bg-[#faf9f6] p-3 text-xs">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                ENGINES ACTIVE
              </span>
              <span className="font-semibold text-slate-700">6/6</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              ChatGPT, Gemini, Claude & Perplexity active.
            </p>
          </div>
        </div>

        {/* Footer Account Area */}
        <div className="p-3 border-t border-slate-200/80 bg-[#faf9f6]">
          <LogoutButton className="w-full justify-center text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/60" />
        </div>
      </aside>
    </>
  );
}

