'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, ArrowUpRight, Menu, X, Shield, ChevronDown } from 'lucide-react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformDropdown, setPlatformDropdown] = useState(false);

  return (
    <>
      {/* Top Enterprise System Announcement Bar */}
      <div className="border-b border-slate-200 bg-[#f4f5f8] px-4 py-2 text-xs font-medium text-slate-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span className="font-mono text-[11px] tracking-tight uppercase text-slate-700">
              System Status: Active
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="hidden text-slate-600 sm:inline">
              Scanning 14.2M+ synthetic brand prompts daily across ChatGPT, Gemini, Claude & Perplexity
            </span>
          </div>
          <div className="hidden items-center gap-4 text-[11px] text-slate-500 md:flex">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-slate-600" /> SOC2 Type II Certified
            </span>
            <span className="text-slate-300">|</span>
            <Link
              href="/security"
              className="hover:text-slate-900 transition-colors underline decoration-slate-300 underline-offset-2"
            >
              Zero-Retention Infrastructure
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Emblem & Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-900 bg-slate-950 text-white transition-transform group-hover:scale-[1.02]">
              <Target className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950 leading-none">
                AI Visibility OS
              </span>
              <span className="text-[10px] font-mono font-medium tracking-widest text-slate-500 uppercase mt-0.5">
                Enterprise Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <div className="relative" onMouseLeave={() => setPlatformDropdown(false)}>
              <button
                onMouseEnter={() => setPlatformDropdown(true)}
                onClick={() => setPlatformDropdown(!platformDropdown)}
                className="flex items-center gap-1 hover:text-slate-950 transition-colors py-2"
              >
                <span>Platform</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {platformDropdown && (
                <div className="absolute top-full left-0 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5">
                  <Link
                    href="/platform"
                    className="block rounded p-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Platform Overview
                    <span className="block font-normal text-slate-500 mt-0.5">
                      Visibility score engine & analytics
                    </span>
                  </Link>
                  <Link
                    href="/solutions"
                    className="block rounded p-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Solutions
                    <span className="block font-normal text-slate-500 mt-0.5">
                      Enterprise SaaS, Fintech, Security
                    </span>
                  </Link>
                  <Link
                    href="/methodology"
                    className="block rounded p-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Methodology Workflow
                    <span className="block font-normal text-slate-500 mt-0.5">
                      Synthetic prompt sampling to remediation
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/solutions" className="hover:text-slate-950 transition-colors">
              Solutions
            </Link>
            <Link href="/methodology" className="hover:text-slate-950 transition-colors">
              Methodology
            </Link>
            <Link href="/competitive-intelligence" className="hover:text-slate-950 transition-colors">
              Competitive Intelligence
            </Link>
            <Link href="/pricing" className="hover:text-slate-950 transition-colors">
              Pricing
            </Link>
            <Link href="/security" className="hover:text-slate-950 transition-colors">
              Security
            </Link>
            <Link href="/resources" className="hover:text-slate-950 transition-colors">
              Resources
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="https://app.aivisibilityos.com/login"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
            >
              Sign In
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all active:scale-[0.99]"
            >
              <span>Run Brand Audit</span>
              <ArrowUpRight className="h-4 w-4 text-slate-300" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md border border-slate-200 p-2 text-slate-700 lg:hidden hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-6 lg:hidden">
            <div className="flex flex-col gap-3 text-sm font-semibold text-slate-800">
              <Link
                href="/platform"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Platform Overview
              </Link>
              <Link
                href="/solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Solutions
              </Link>
              <Link
                href="/methodology"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Methodology
              </Link>
              <Link
                href="/competitive-intelligence"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Competitive Intelligence
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Pricing & Plans
              </Link>
              <Link
                href="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Security & Compliance
              </Link>
              <Link
                href="/resources"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Resources & Case Studies
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 border-b border-slate-100"
              >
                Contact Sales
              </Link>
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 py-3 text-center text-sm font-semibold text-white"
                >
                  Run Free Brand Audit
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

