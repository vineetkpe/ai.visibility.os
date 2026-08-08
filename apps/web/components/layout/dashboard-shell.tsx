'use client';

import React, { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export interface DashboardShellProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  children: ReactNode;
}

export function DashboardShell({
  displayName,
  avatarUrl,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
