import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, Scan, ScrollText, Cpu, Settings, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/scans', label: 'Scans & Jobs', icon: Scan },
  { href: '/admin/logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/providers', label: 'AI Engines', icon: Cpu },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fadmin');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'owner'].includes(profile.role)) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><Shield className="h-4 w-4" /></div>
            <div><p className="text-sm font-semibold">AI Visibility OS</p><p className="text-[11px] font-medium uppercase tracking-wider text-amber-600">Admin Console</p></div>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"><Icon className="h-4 w-4" />{label}</Link>
            ))}
          </nav>
          <div className="border-t border-slate-200 p-4"><Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-950">← Back to user app</Link></div>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8"><div><p className="text-sm font-semibold">Admin Console</p><p className="text-xs text-slate-500">Full platform administration</p></div><div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{profile.role.toUpperCase()}</div></header>
          <div className="p-5 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
