'use client';

import React from 'react';
import { ShieldCheck, Lock, Server, FileCheck, Award, EyeOff } from 'lucide-react';

const trustFeatures = [
  {
    icon: ShieldCheck,
    title: 'Enterprise Security Architecture',
    description:
      'Rigorous security controls ensuring enterprise-grade data protection, confidentiality, and operational availability for sensitive brand data.',
  },
  {
    icon: EyeOff,
    title: 'Zero Data Retention Isolation',
    description:
      'All synthetic prompt scanning and LLM responses are processed via enterprise API agreements that prohibit provider model training.',
  },
  {
    icon: Server,
    title: 'Dedicated VPC & Proxy Sandboxing',
    description:
      'Enterprise customers can route AI search audits through custom proxy subnets to simulate localized search behavior without exposing IP identity.',
  },
  {
    icon: Lock,
    title: 'Granular Role-Based Access Control',
    description:
      'SSO (SAML 2.0 / Okta / Azure AD), enforced multi-factor authentication, and custom team permissions for C-suite executive reporting.',
  },
];

export function TrustSecurity() {
  return (
    <section id="trust" className="border-b border-slate-200 bg-[#fafafb] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            08 // Enterprise Security
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Built for Global Fortune 500 Security Standards
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Enterprise brands trust AI Visibility OS with their core competitive strategy. We safeguard your data with strict zero-retention policies, custom proxy routing, and enterprise security controls.
          </p>
        </div>

        {/* 4 Pillar Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
          {trustFeatures.map((tf, i) => {
            const Icon = tf.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-slate-400"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-900 bg-slate-950 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{tf.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{tf.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Seals & SLA Bar */}
        <div className="mt-12 rounded-xl border border-slate-300 bg-white p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-slate-950" />
            <div>
              <span className="font-bold text-sm text-slate-950 block">
                Enterprise Uptime & Compliance Commitment
              </span>
              <span className="text-xs text-slate-500 font-mono">
                99.9% Uptime SLA • Dedicated Security Counsel SLA • Quarterly Pen-Test Reports
              </span>
            </div>
          </div>

          <a
            href="#pricing"
            className="font-mono text-xs font-bold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950"
          >
            Download SOC2 Compliance Package &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
