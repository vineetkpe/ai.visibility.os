'use client';

import React, { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, Bot, ChevronLeft, ClipboardList, Database, FileText, Gauge, LayoutDashboard, Menu, Search, Settings, ShieldCheck, ScanLine, Users } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

export interface DashboardShellProps { displayName?: string | null; avatarUrl?: string | null; isAdmin?: boolean; children: ReactNode; }

const adminGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }, { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }, { label: 'Forecasts', href: '/admin/forecasts', icon: Gauge }] },
  { label: 'Platform', items: [{ label: 'Users & Accounts', href: '/admin/users', icon: Users }, { label: 'Projects', href: '/admin/projects', icon: Database }, { label: 'AI Scans', href: '/admin/scans', icon: ScanLine }, { label: 'AI Engines', href: '/admin/providers', icon: Bot }] },
  { label: 'Operations', items: [{ label: 'Jobs & Automation', href: '/admin/jobs', icon: Activity }, { label: 'Audit & Security', href: '/admin/logs', icon: ShieldCheck }, { label: 'Reports', href: '/admin/reports', icon: FileText }, { label: 'Tasks', href: '/admin/tasks', icon: ClipboardList }] },
  { label: 'Configuration', items: [{ label: 'System Settings', href: '/admin/settings', icon: Settings }] },
];

function AdminShell({ displayName, children }: { displayName?: string | null; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return <div className="min-h-screen bg-[#f5f7fb] text-slate-950"><div className="flex min-h-screen">
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-950 text-slate-300 transition-all lg:static', collapsed ? 'w-[76px]' : 'w-[264px]', open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
      <div className="flex h-16 items-center border-b border-slate-800 px-4"><Link href="/admin" className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950"><ShieldCheck className="h-5 w-5" /></div>{!collapsed && <div><div className="text-sm font-bold text-white">AI Visibility OS</div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">Admin Console</div></div>}</Link></div>
      <div className="flex-1 overflow-y-auto px-3 py-5">{adminGroups.map((group) => <div key={group.label} className="mb-6"><div className={cn('mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500', collapsed && 'px-0 text-center')}>{collapsed ? '•' : group.label}</div><nav className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} title={collapsed ? item.label : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-white', collapsed && 'justify-center px-2')}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>; })}</nav></div>)}</div>
      <div className="border-t border-slate-800 p-3"><div className={cn('mb-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400', collapsed && 'hidden')}><div className="font-semibold text-white">{displayName || 'Administrator'}</div><div>Privileged access</div></div><LogoutButton className="w-full justify-center border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white" /></div>
    </aside>
    {open && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)} aria-label="Close admin navigation" />}
    <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7"><div className="flex items-center gap-3"><button className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open admin navigation"><Menu className="h-4 w-4" /></button><button className="hidden rounded-lg border border-slate-200 p-2 lg:block" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle admin navigation"><ChevronLeft className={cn('h-4 w-4', collapsed && 'rotate-180')} /></button><div className="hidden text-sm text-slate-500 sm:block">Administration <span className="mx-2 text-slate-300">/</span><span className="font-semibold capitalize text-slate-900">{pathname === '/admin' ? 'Dashboard' : pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ')}</span></div></div><div className="flex items-center gap-2"><Link href="/admin/users" className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex"><Search className="h-4 w-4" />Find user</Link><Link href="/dashboard" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">User App</Link></div></header><main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div></div>;
}

export function DashboardShell({ displayName, avatarUrl, isAdmin = false, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (isAdmin && pathname.startsWith('/admin')) return <AdminShell displayName={displayName}>{children}</AdminShell>;
  return <div className="flex min-h-screen bg-slate-50"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} /><div className="flex flex-1 flex-col min-w-0"><Header onMenuToggle={() => setSidebarOpen(true)} displayName={displayName} avatarUrl={avatarUrl} /><main className="flex-1 overflow-y-auto">{children}</main></div></div>;
}
