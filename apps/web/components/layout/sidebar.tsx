'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Scan,
  Building,
  Lightbulb,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Competitors', href: '/competitors', icon: Building },
  { label: 'Recommendations', href: '/recommendations', icon: Lightbulb },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Monitors', href: '/monitors', icon: Activity },
  { label: 'AI Scans', href: '/dashboard/scans', icon: Scan },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen = false, onClose, className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        {...props}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/80">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900 text-base tracking-tight">
              AI Visibility OS
            </span>
          </Link>

          {/* Close button on mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-500"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Platform
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info placeholder */}
        <div className="p-4 border-t border-slate-200/80">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200/60">
            <div className="font-medium text-slate-900">System Ready</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Light Theme v1.0</div>
          </div>
        </div>
      </aside>
    </>
  );
}
