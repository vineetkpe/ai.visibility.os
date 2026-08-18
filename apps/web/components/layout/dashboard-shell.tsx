'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export interface DashboardShellProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  activeProject?: { id: string; name: string } | null;
  children: ReactNode;
}

export function DashboardShell({ displayName, avatarUrl, isAdmin = false, activeProject = null, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        activeProject={activeProject}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
