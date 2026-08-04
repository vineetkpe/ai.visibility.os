import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
      {/* Brand Header */}
      <Link href="/" className="mb-6 flex items-center space-x-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
          <Shield className="h-4 w-4" />
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">
          AI Visibility OS
        </span>
      </Link>

      {/* Form Container */}
      <div className="w-full max-w-md">{children}</div>

      {/* Sub-footer note */}
      <div className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AI Visibility OS. Secure Supabase Authentication.
      </div>
    </div>
  );
}
