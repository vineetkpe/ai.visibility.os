'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Shield, Activity, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#fafafb] text-slate-600 text-xs">
      {/* Upper Newsletter & Status Bar */}
      <div className="border-b border-slate-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
              <Shield className="h-3.5 w-3.5 text-slate-700" /> SOC2 Type II Certified
            </span>
            <span>|</span>
            <span>Zero-Retention Audit Guarantee</span>
          </div>
        </div>
      </div>

      {/* Main 4-Column Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-900 bg-slate-950 text-white">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-950">
                AI Visibility OS
              </span>
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              The authoritative enterprise platform for tracking, auditing, and optimizing how AI answer engines (ChatGPT, Gemini, Claude, Perplexity) represent and cite your brand.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-400">
              © {new Date().getFullYear()} AI Visibility OS Inc. All rights reserved.
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-950">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#visibility-score" className="hover:text-slate-950 transition-colors">
                  Visibility Score Engine
                </a>
              </li>
              <li>
                <a href="#engines" className="hover:text-slate-950 transition-colors">
                  Multi-Engine Coverage
                </a>
              </li>
              <li>
                <a href="#competitive" className="hover:text-slate-950 transition-colors">
                  Share of Voice Benchmarks
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-slate-950 transition-colors">
                  Automated GEO Blueprints
                </a>
              </li>
              <li>
                <a href="#analytics" className="hover:text-slate-950 transition-colors">
                  Executive Reports
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-950">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#pricing" className="hover:text-slate-950 transition-colors">
                  Enterprise B2B SaaS
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-slate-950 transition-colors">
                  Fintech & Payments
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-slate-950 transition-colors">
                  Cybersecurity & Cloud
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-slate-950 transition-colors">
                  Developer Infrastructure
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Security & Legal */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-950">
              Trust & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#trust" className="hover:text-slate-950 transition-colors">
                  SOC2 Type II Report
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-slate-950 transition-colors">
                  Security Portal
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-slate-950 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-slate-950 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
