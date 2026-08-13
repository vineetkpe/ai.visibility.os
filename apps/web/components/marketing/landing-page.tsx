'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FileSearch,
  Gauge,
  Globe2,
  Layers3,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

const engines = [
  { name: 'Google Gemini', short: 'Gemini', score: 82, visibility: '+14%', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'ChatGPT', short: 'ChatGPT', score: 76, visibility: '+9%', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { name: 'Claude', short: 'Claude', score: 69, visibility: '+6%', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Perplexity', short: 'Perplexity', score: 64, visibility: '+4%', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

const faqs = [
  ['What does AI Visibility OS measure?', 'It measures how often your brand appears in AI-generated answers, what sources those systems cite, how competitors are positioned, and which content opportunities can improve visibility.'],
  ['Do I need to change my website to start?', 'No. Start with your domain and business context. The platform turns the resulting evidence into a prioritized visibility plan rather than asking you to guess what to optimize.'],
  ['Which AI engines can I monitor?', 'The platform is designed around a provider registry, so engines can be enabled and managed without rewriting the scanner. Gemini, ChatGPT, Claude and Perplexity are represented in the product experience.'],
  ['Is this another SEO dashboard?', 'No. Traditional SEO focuses heavily on search rankings. AI Visibility OS focuses on the answers people receive from AI systems and the sources those systems trust.'],
];

function MiniChart() {
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <div className="absolute inset-x-5 top-5 flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
        <span>Visibility trend</span><span>Last 30 days</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 top-14">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => <span key={line} className="border-t border-dashed border-slate-100" />)}
        </div>
        <svg viewBox="0 0 700 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M0 126 C55 118, 75 104, 120 110 S195 95, 235 99 S300 76, 345 82 S410 60, 450 70 S515 42, 555 52 S620 29, 700 22" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-900" />
          <path d="M0 126 C55 118, 75 104, 120 110 S195 95, 235 99 S300 76, 345 82 S410 60, 450 70 S515 42, 555 52 S620 29, 700 22 L700 150 L0 150 Z" fill="currentColor" className="text-slate-900/5" />
        </svg>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [activeEngine, setActiveEngine] = useState(engines[0]);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="overflow-hidden bg-[#fbfcfe] text-slate-950 selection:bg-slate-900 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfcfe]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="AI Visibility OS home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Target className="h-4 w-4" /></span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">AI Visibility OS</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-500 md:flex">
            <a href="#platform" className="transition hover:text-slate-950">Platform</a>
            <a href="#how-it-works" className="transition hover:text-slate-950">How it works</a>
            <a href="#engines" className="transition hover:text-slate-950">AI engines</a>
            <a href="#resources" className="transition hover:text-slate-950">Resources</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex">Sign in</Link>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">Start free <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Visibility intelligence for the AI era
            </div>
            <h1 className="max-w-3xl text-[clamp(3.2rem,7vw,6.2rem)] font-semibold leading-[.94] tracking-[-0.065em] text-slate-950">
              Be the answer<br /><span className="text-slate-400">AI recommends.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Measure how AI systems see your brand, understand why you are being cited—or ignored—and turn every finding into a prioritized growth plan.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800">Create your visibility workspace <ArrowRight className="h-4 w-4" /></Link>
              <a href="#platform" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Explore the platform <ChevronRight className="h-4 w-4" /></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> No credit card required</span>
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> Built for teams</span>
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> Evidence-first reports</span>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-slate-100 via-transparent to-blue-50/50 blur-2xl" />
            <div className="relative rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-30px_rgba(15,23,42,.25)]">
              <div className="rounded-[21px] border border-slate-100 bg-[#f8fafc] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">Visibility overview</div><div className="mt-1 text-sm font-semibold">acme.com</div></div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Healthy +8.4%</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[['Visibility score', '78'], ['AI mentions', '142'], ['Citations', '86']].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><div className="text-[10px] font-medium text-slate-400">{label}</div><div className="mt-1.5 text-xl font-semibold tracking-tight">{value}</div></div>)}
                </div>
                <div className="mt-3"><MiniChart /></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between text-xs"><span className="font-medium">Citation coverage</span><span className="font-semibold">64%</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-[64%] rounded-full bg-slate-900" /></div></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between text-xs"><span className="font-medium">Competitor gap</span><span className="font-semibold text-emerald-600">-12%</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-[72%] rounded-full bg-emerald-500" /></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">
          {[['4+', 'AI engines'], ['30+', 'visibility signals'], ['1', 'actionable workspace'], ['∞', 'queries to learn from']].map(([value, label]) => <div key={label} className="px-5 py-7 sm:px-8"><div className="text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">One operating view</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">From AI visibility signal to business action.</h2><p className="mt-5 text-lg leading-8 text-slate-500">Everything you need to understand where your brand appears in AI answers, what influences those answers, and what to improve next.</p></div>
        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {[
            { icon: Gauge, title: 'Measure visibility', copy: 'A single score backed by query-level evidence, provider coverage and trend data.', span: 'lg:col-span-7', tone: 'bg-slate-950 text-white' },
            { icon: FileSearch, title: 'Understand citations', copy: 'See which pages and external sources AI systems trust when they talk about your category.', span: 'lg:col-span-5', tone: 'bg-white text-slate-950' },
            { icon: LineChart, title: 'Track competitors', copy: 'Compare share of voice, mentions, citations and visibility movement against the brands you care about.', span: 'lg:col-span-5', tone: 'bg-white text-slate-950' },
            { icon: Zap, title: 'Prioritize what matters', copy: 'Turn findings into concrete optimization tasks with impact, evidence and a clear next action.', span: 'lg:col-span-7', tone: 'bg-[#f1f5f9] text-slate-950' },
          ].map(({ icon: Icon, title, copy, span, tone }) => <div key={title} className={`${span} ${tone} min-h-[230px] rounded-3xl border border-slate-200 p-7 sm:p-9`}><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/10 bg-current/5"><Icon className="h-5 w-5" /></div><div className="mt-16 max-w-md"><h3 className="text-xl font-semibold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 opacity-65">{copy}</p></div></div>)}
        </div>
      </section>

      <section id="engines" className="border-y border-slate-200 bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
            <div><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Engine intelligence</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">One view across the AI landscape.</h2><p className="mt-5 max-w-lg text-lg leading-8 text-slate-500">Compare how different AI engines discover, describe and cite your brand. Your provider mix stays configurable as the landscape changes.</p><div className="mt-8 flex flex-wrap gap-2">{engines.map((engine) => <button key={engine.name} onClick={() => setActiveEngine(engine)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${activeEngine.name === engine.name ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{engine.short}</button>)}</div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between"><div><div className="text-xs font-medium text-slate-400">Current engine</div><div className="mt-1 text-2xl font-semibold tracking-tight">{activeEngine.name}</div></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${activeEngine.color}`}>{activeEngine.visibility} visibility</span></div><div className="mt-9 flex items-end gap-3"><span className="text-6xl font-semibold tracking-[-.06em]">{activeEngine.score}</span><span className="mb-2 text-sm text-slate-400">/ 100 visibility</span></div><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-950 transition-all duration-500" style={{ width: `${activeEngine.score}%` }} /></div><div className="mt-7 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-400">Mentions</div><div className="mt-1 text-lg font-semibold">{Math.round(activeEngine.score * 1.8)}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-400">Citations</div><div className="mt-1 text-lg font-semibold">{Math.round(activeEngine.score * .82)}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-400">Trend</div><div className="mt-1 text-lg font-semibold text-emerald-600">Up</div></div></div></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">How it works</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">A continuous visibility loop.</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">The product is designed to make the next decision obvious—not to overwhelm you with another analytics console.</p></div>
        <div className="mt-14 grid gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-4">
          {[['01', 'Connect', 'Add your brand, domain and business context.'], ['02', 'Measure', 'Run visibility checks across your selected AI engines.'], ['03', 'Explain', 'Trace mentions, citations and competitor movement back to evidence.'], ['04', 'Improve', 'Work through prioritized recommendations and measure the change.']].map(([number, title, copy], index) => <div key={number} className={`p-7 sm:p-8 ${index ? 'border-t border-slate-200 md:border-l md:border-t-0' : ''}`}><div className="text-xs font-bold text-slate-300">{number}</div><h3 className="mt-12 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>)}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-28">
          <div><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">The output</div><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Know what AI says. Know what to do about it.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Every scan is organized around the questions your team actually needs answered.</p><div className="mt-8 space-y-3">{['What happened?', 'What did we find?', 'What should we do next?', 'What evidence supports it?'].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-medium"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10"><Check className="h-3 w-3" /></span>{item}</div>)}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-400">Recommended next actions</span><span className="text-xs text-emerald-400">3 high impact</span></div><div className="mt-5 space-y-2">{[['Build a comparison page', 'High impact', '12 min'], ['Strengthen product entity signals', 'High impact', '24 min'], ['Add citations to pricing content', 'Medium impact', '18 min']].map(([title, impact, time]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium">{title}</div><div className="mt-1 text-xs text-slate-500">{impact}</div></div><span className="text-xs text-slate-500">{time}</span></div></div>)}</div><button className="mt-4 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">View recommendations <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl text-center"><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Built for serious teams</div><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Clarity without the dashboard theater.</h2><p className="mt-5 text-lg leading-8 text-slate-500">A calm interface for a noisy new channel. Keep your team focused on evidence, movement and action.</p></div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-3xl border border-slate-200 bg-white p-7"><Globe2 className="h-5 w-5" /><h3 className="mt-14 font-semibold">Evidence-first</h3><p className="mt-2 text-sm leading-6 text-slate-500">Trace every important finding back to the query, response and cited source.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-7"><Layers3 className="h-5 w-5" /><h3 className="mt-14 font-semibold">Provider-ready</h3><p className="mt-2 text-sm leading-6 text-slate-500">Manage the AI engines behind your workspace as the ecosystem changes.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-7"><ShieldCheck className="h-5 w-5" /><h3 className="mt-14 font-semibold">Built for control</h3><p className="mt-2 text-sm leading-6 text-slate-500">Separate workspace operations from privileged administration and security controls.</p></div></div>
      </section>

      <section className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-3xl px-5 py-24 sm:px-8"><div className="text-center"><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">FAQ</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Questions, answered.</h2></div><div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer], index) => <div key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-6 py-5 text-left text-sm font-semibold"><span>{question}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="-mt-1 pb-5 pr-8 text-sm leading-6 text-slate-500">{answer}</p>}</div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="overflow-hidden rounded-[32px] bg-slate-100 px-6 py-14 text-center sm:px-10 sm:py-20"><div className="mx-auto max-w-2xl"><Sparkles className="mx-auto h-5 w-5 text-slate-500" /><h2 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Make your brand easier for AI to trust.</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-500">Start with one domain. Build a visibility system your team can actually use.</p><Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">Start your workspace <ArrowRight className="h-4 w-4" /></Link></div></div></section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-2 font-semibold text-slate-700"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white"><Target className="h-3.5 w-3.5" /></span>AI Visibility OS</div><div className="flex flex-wrap gap-5"><a href="#platform" className="hover:text-slate-700">Platform</a><a href="#how-it-works" className="hover:text-slate-700">How it works</a><Link href="/login" className="hover:text-slate-700">Sign in</Link><Link href="/signup" className="hover:text-slate-700">Start free</Link></div><span>© 2026 AI Visibility OS</span></div></footer>
    </main>
  );
}
