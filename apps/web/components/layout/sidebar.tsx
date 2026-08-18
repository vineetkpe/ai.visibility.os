'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building,
  FileText,
  FolderKanban,
  Gauge,
  Lightbulb,
  ScanLine,
  Settings,
  Shield,
  ShieldAlert,
  X,
  Plus,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
  onClose?: () => void;
  isAdmin?: boolean;
}

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: Gauge },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Visibility',
    items: [
      { label: 'Score', href: '/dashboard/score', icon: BarChart3 },
      { label: 'AI Engines', href: '/dashboard/engines', icon: Database },
      { label: 'Scan History', href: '/dashboard/scans', icon: ScanLine },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Recommendations', href: '/recommendations', icon: Lightbulb },
      { label: 'Competitors', href: '/competitors', icon: Building },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
];

export function Sidebar({ isOpen = false, onClose, isAdmin = false, className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin: _isAdmin, isOpen: _isOpen, onClose: _onClose, ...asideProps } = props as Record<string, unknown>;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-[#e2e4e9] bg-white text-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
        {...asideProps}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#e2e4e9] px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-slate-950">AI Visibility OS</div>
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-400">Workspace</div>
            </div>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 lg:hidden" onClick={onClose} aria-label="Close sidebar">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="border-b border-[#e2e4e9] p-3">
          <Link
            href="/projects"
            onClick={onClose}
            className="flex items-center justify-between rounded-md border border-[#e2e4e9] bg-[#faf9f6] px-3 py-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Project</div>
              <div className="mt-0.5 truncate text-xs font-semibold text-slate-900">Choose a project</div>
            </div>
            <FolderKanban className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
          <Button asChild className="mt-2 h-8 w-full justify-center gap-1.5 bg-slate-950 text-xs font-semibold text-white hover:bg-slate-800">
            <Link href="/projects/new" onClick={onClose}>
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Link>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </p>
              <nav className="space-y-0.5" aria-label={`${group.label} navigation`}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-slate-950 text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {isAdmin && (
            <div className="mt-6 border-t border-[#e2e4e9] pt-4">
              <p className="mb-1.5 px-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-slate-400">
                Administration
              </p>
              <Link
                href="/admin"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors',
                  pathname.startsWith('/admin')
                    ? 'border-slate-900 bg-slate-950 text-white'
                    : 'border-[#e2e4e9] bg-white text-slate-700 hover:bg-slate-100',
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                <span>Admin Operations</span>
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-[#e2e4e9] p-2.5">
          <LogoutButton className="w-full justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950" />
        </div>
      </aside>
    </>
  );
}
