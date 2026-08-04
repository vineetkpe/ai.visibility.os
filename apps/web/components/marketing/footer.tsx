import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-sm text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold tracking-tight text-slate-900 text-base">
                AI Visibility OS
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              The operating system for measuring and improving how businesses appear across AI platforms.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/features" className="hover:text-slate-900 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/app-shell-preview" className="hover:text-slate-900 transition-colors">
                  App Shell Preview
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Legal & System
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">Privacy Policy</li>
              <li className="text-slate-400">Terms of Service</li>
              <li className="text-slate-400">Light Theme v1.0</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AI Visibility OS. All rights reserved.</p>
          <p>Built with Next.js 16 & Tailwind CSS v4</p>
        </div>
      </div>
    </footer>
  );
}
