'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/90 bg-[#faf9f6] text-slate-600 text-xs">
      {/* Upper System Status Bar */}
      <div className="border-b border-slate-200/80 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            </span>
            <span className="font-mono text-xs font-semibold text-slate-900">
              System Operational: 6/6 AI Engine Registries Scanning Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-slate-700" /> Enterprise Security Standards
            </span>
            <span>|</span>
            <span>Zero-Retention Audit Guarantee</span>
          </div>
        </div>
      </div>

      {/* Main 5-Group Enterprise Footer Grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Info Column */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-900 bg-slate-950 text-white transition-transform group-hover:scale-[1.02]">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-950">
                AI Visibility OS
              </span>
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              The enterprise GEO platform for auditing, tracking, and optimizing brand presence across ChatGPT, Gemini, Claude, and Perplexity.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-400">
              © 2026 AI Visibility OS Inc. All rights reserved.
            </div>
          </div>

          {/* Group 1: Product */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-950">
              Product
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/platform" className="hover:text-slate-950 transition-colors">
                  Platform
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-slate-950 transition-colors">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-slate-950 transition-colors">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-950 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 2: Company */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-950">
              Company
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/resources" className="hover:text-slate-950 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-950 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-slate-950 transition-colors">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 3: Security */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-950">
              Security
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/security" className="hover:text-slate-950 transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-slate-950 transition-colors">
                  Trust Center
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-slate-950 transition-colors">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 4: Legal & Application */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-950">
              Legal & App
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/privacy" className="hover:text-slate-950 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-950 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-slate-950 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-slate-950 transition-colors">
                  Acceptable Use
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-200/60">
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 hover:text-amber-600 transition-colors"
                >
                  Sign In →
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Get Started →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

