import React from 'react';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const platforms = [
  {
    name: 'Gemini',
    provider: 'Google',
    status: 'Active',
    isActive: true,
    description: 'Full audit support for Gemini search synthesis and source citations.',
  },
  {
    name: 'Groq',
    provider: 'Groq LPU',
    status: 'Coming Soon',
    isActive: false,
    description: 'High-speed LLM inference model visibility evaluation.',
  },
  {
    name: 'OpenAI',
    provider: 'OpenAI GPT-4o',
    status: 'Coming Soon',
    isActive: false,
    description: 'ChatGPT search and web retrieval citation analysis.',
  },
  {
    name: 'Claude',
    provider: 'Anthropic',
    status: 'Coming Soon',
    isActive: false,
    description: 'Claude search grounding and factual mention tracking.',
  },
];

export function SupportedPlatforms() {
  return (
    <section className="py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Supported Platforms
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Multi-Model AI Ecosystem Coverage
          </p>
          <p className="text-base text-slate-600">
            Audit your brand across major conversational AI models and retrieval platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform) => (
            <Card
              key={platform.name}
              className={`border ${
                platform.isActive
                  ? 'border-slate-300 bg-white shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              <CardHeader className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      platform.isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-200/60 text-slate-600'
                    }`}
                  >
                    {platform.isActive ? (
                      <CheckCircle2 className="h-3 w-3 text-slate-900" />
                    ) : (
                      <Clock className="h-3 w-3 text-slate-500" />
                    )}
                    {platform.status}
                  </span>
                </div>
                <CardTitle className="text-lg">{platform.name}</CardTitle>
                <div className="text-xs font-mono text-slate-400">{platform.provider}</div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 leading-relaxed">{platform.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
