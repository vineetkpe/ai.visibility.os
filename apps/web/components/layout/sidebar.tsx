'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scan, Building, Lightbulb, Settings, Shield, ShieldAlert, X, Plus, Sparkles, FolderKanban, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/logout-button';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> { isOpen?: boolean; onClose?: () => void; isAdmin?: boolean; }
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Score Breakdown', href: '/dashboard/score', icon: Sparkles },
  { label: 'AI Engine Registry', href: '/dashboard/engines', icon: Shield },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Scan History', href: '/dashboard/scans', icon: Scan },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Recommendations', href: '/recommendations', icon: Lightbulb },
  { label: 'Competitors', href: '/competitors', icon: Building },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen = false, onClose, isAdmin = false, className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin: _isAdmin, isOpen: _isOpen, onClose: _onClose, ...asideProps } = props as Record<string, unknown>;
  return <>
    {isOpen && <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden" onClick={onClose} aria-hidden="true" />}
    <aside className={cn('fixed top-0 bottom-0 left-0 z-50 flex w-[230px] flex-col border-r border-[#e2e4e9] bg-[#faf9f6] text-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 select-none', isOpen ? 'translate-x-0' : '-translate-x-full', className)} {...asideProps}>
      <div className="flex h-13 items-center justify-between px-4 border-b border-[#e2e4e9] bg-white"><Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}><div className="flex h-6 w-6 items-center justify-center rounded border border-slate-900 bg-slate-950 text-white shadow-2xs"><Shield className="h-3.5 w-3.5" /></div><div className="flex flex-col"><span className="font-bold text-slate-950 text-xs tracking-tight leading-none">AI Visibility OS</span><span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Enterprise</span></div></Link>{onClose && <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7 text-slate-500 hover:text-slate-900" onClick={onClose} aria-label="Close sidebar"><X className="h-3.5 w-3.5" /></Button>}</div>
      <div className="p-3 border-b border-[#e2e4e9] bg-white"><div className="mb-2 rounded border border-[#e2e4e9] bg-[#faf9f6] p-2"><div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-0.5"><span>WORKSPACE</span><span className="text-slate-900 font-bold">ACTIVE</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-900 truncate">Main Brand Portfolio</span><FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" /></div></div><Button asChild className="w-full justify-center gap-1.5 bg-slate-950 text-white hover:bg-slate-800 font-semibold border border-slate-900 text-xs h-8 shadow-2xs"><Link href="/projects/new" onClick={onClose}><Plus className="h-3.5 w-3.5 stroke-[2.5]" /><span>New Project</span></Link></Button></div>
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5"><div><p className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5">Platform Modules</p><nav className="space-y-0.5">{navItems.map((item) => { const Icon = item.icon; const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={onClose} className={cn('flex items-center space-x-2.5 rounded px-2.5 py-1.5 text-xs font-medium transition-all relative', isActive ? 'bg-slate-950 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950')}><Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} /><span>{item.label}</span>{isActive && <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-amber-400" />}</Link>; })}</nav></div>{isAdmin && <div><p className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-slate-500" />Administration</p><nav className="space-y-0.5"><Link href="/admin" onClick={onClose} className={cn('flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-semibold border transition-all', pathname.startsWith('/admin') ? 'bg-slate-950 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-700 border-[#e2e4e9] hover:bg-slate-100')}><div className="flex items-center space-x-2"><ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" /><span>Admin Operations</span></div><span className="rounded bg-slate-100 px-1 py-0.2 text-[8px] font-mono uppercase text-slate-700 font-bold border border-[#e2e4e9]">Ops</span></Link></nav></div>}<div className="mx-1 rounded border border-[#e2e4e9] bg-white p-2.5 text-xs"><div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-0.5"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />ENGINE CONFIGURATION</span><span className="font-bold text-slate-900">1/4</span></div><p className="text-[10px] text-slate-500 leading-tight">Gemini is configured. Other engines remain disabled until their API credentials are added.</p></div></div>
      <div className="p-2.5 border-t border-[#e2e4e9] bg-white"><LogoutButton className="w-full justify-center text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100" /></div>
    </aside>
  </>;
}
