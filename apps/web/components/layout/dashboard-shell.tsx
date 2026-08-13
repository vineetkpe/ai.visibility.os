'use client';

import React, { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bot,
  ChevronLeft,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  ScanLine,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

export interface DashboardShellProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  children: ReactNode;
}

const adminGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Ops Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Forecasts', href: '/admin/forecasts', icon: Gauge },
    ],
  },
  {
    label: 'Platform Core',
    items: [
      { label: 'Users & Accounts', href: '/admin/users', icon: Users },
      { label: 'Projects Registry', href: '/admin/projects', icon: Database },
      { label: 'Scan Engine Logs', href: '/admin/scans', icon: ScanLine },
      { label: 'AI Providers', href: '/admin/providers', icon: Bot },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Jobs & Queue', href: '/admin/jobs', icon: Activity },
      { label: 'Audit & Security', href: '/admin/logs', icon: ShieldCheck },
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'System Settings', href: '/admin/settings', icon: Settings }],
  },
];

function AdminShell({
  displayName,
  children,
}: {
  displayName?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="flex min-h-screen">
        {/* Enterprise Operations Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white text-slate-700 transition-all lg:static shadow-xs',
            collapsed ? 'w-[72px]' : 'w-[260px]',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* Admin Header Branding */}
          <div className="flex h-16 items-center border-b border-slate-200/80 px-4 bg-[#faf9f6]">
            <Link href="/admin" className="flex min-w-0 items-center gap-3 group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-600 bg-amber-500 text-slate-950 shadow-xs">
                <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <div className="text-sm font-bold tracking-tight text-slate-950 leading-none">
                    AI Visibility OS
                  </div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-amber-700 mt-1">
                    Ops Console
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {adminGroups.map((group) => (
              <div key={group.label}>
                <div
                  className={cn(
                    'mb-2 px-2 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-400',
                    collapsed && 'px-0 text-center'
                  )}
                >
                  {collapsed ? '•' : group.label}
                </div>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all relative',
                          active
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            active ? 'text-amber-400' : 'text-slate-400'
                          )}
                        />
                        {!collapsed && <span>{item.label}</span>}
                        {active && !collapsed && (
                          <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Admin User Info Footer */}
          <div className="border-t border-slate-200/80 p-3 bg-[#faf9f6]">
            <div
              className={cn(
                'mb-2.5 rounded-md border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-slate-700',
                collapsed && 'hidden'
              )}
            >
              <div className="flex items-center justify-between font-mono text-[10px] text-amber-800 font-semibold mb-0.5">
                <span>ROLE: ADMIN</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <div className="font-semibold text-slate-900 truncate">
                {displayName || 'Administrator'}
              </div>
            </div>
            <LogoutButton className="w-full justify-center text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/60" />
          </div>
        </aside>

        {open && (
          <button
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close admin navigation"
          />
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-sm lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open admin navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                className="hidden rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:block"
                onClick={() => setCollapsed((v) => !v)}
                aria-label="Toggle admin navigation"
              >
                <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
              </button>
              <div className="hidden text-xs font-mono text-slate-500 sm:flex items-center gap-2">
                <span>OPERATIONS CONSOLE</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {pathname === '/admin'
                    ? 'Overview'
                    : pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-xs font-mono text-amber-900">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>SYSTEM HEALTH: OPTIMAL</span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
              >
                <span>User App</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8 bg-[#faf9f6]">{children}</main>

          {/* Mobile Bottom Navigation Bar for Admin */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-[#e2e4e9] bg-white px-2 lg:hidden shadow-xs">
            <Link
              href="/admin"
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
                pathname === '/admin' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
                pathname.startsWith('/admin/users') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
            <Link
              href="/admin/scans"
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
                pathname.startsWith('/admin/scans') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <ScanLine className="h-4 w-4" />
              <span>Scans</span>
            </Link>
            <Link
              href="/admin/jobs"
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
                pathname.startsWith('/admin/jobs') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Activity className="h-4 w-4" />
              <span>Jobs</span>
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900"
            >
              <Menu className="h-4 w-4" />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  displayName,
  avatarUrl,
  isAdmin = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAdmin && pathname.startsWith('/admin')) {
    return <AdminShell displayName={displayName}>{children}</AdminShell>;
  }

  return (
    <div className="flex min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">{children}</main>

        {/* Mobile Bottom Navigation Bar for User App */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-[#e2e4e9] bg-white px-2 lg:hidden shadow-xs">
          <Link
            href="/dashboard"
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
              pathname === '/dashboard' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/projects"
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
              pathname.startsWith('/projects') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Database className="h-4 w-4" />
            <span>Projects</span>
          </Link>
          <Link
            href="/dashboard/scans"
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
              pathname.startsWith('/dashboard/scans') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <ScanLine className="h-4 w-4" />
            <span>Scans</span>
          </Link>
          <Link
            href="/recommendations"
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
              pathname.startsWith('/recommendations') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Insights</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900"
          >
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

