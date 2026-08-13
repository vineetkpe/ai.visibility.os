'use client';

import React from 'react';
import { Send } from 'lucide-react';

export function ContactForm() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full rounded-md border border-slate-200 bg-[#faf9f6] px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-700 mb-1">
            Work Email
          </label>
          <input
            type="email"
            required
            placeholder="jane@company.com"
            className="w-full rounded-md border border-slate-200 bg-[#faf9f6] px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            required
            placeholder="Acme Enterprise"
            className="w-full rounded-md border border-slate-200 bg-[#faf9f6] px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-700 mb-1">
            Project Details / Inquiry
          </label>
          <textarea
            rows={4}
            placeholder="Tell us about your brand visibility goals..."
            className="w-full rounded-md border border-slate-200 bg-[#faf9f6] px-3.5 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 py-3 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
        >
          <Send className="h-3.5 w-3.5 text-amber-400" />
          <span>Request Enterprise Consultation</span>
        </button>
      </form>
    </div>
  );
}
