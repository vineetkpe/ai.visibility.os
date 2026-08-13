'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createProjectAction } from '@/app/(dashboard)/projects/actions';
import { createProjectSchema, extractDomainName } from '@ai-visibility-os/shared';
import { Globe2, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ProjectFormProps { redirectOnSuccess?: string; onSuccess?: () => void; }

export function ProjectForm({ redirectOnSuccess = '/dashboard', onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; websiteUrl?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setFieldErrors({}); setGeneralError(null);
    const result = createProjectSchema.safeParse({ name, websiteUrl });
    if (!result.success) {
      const errors: { name?: string; websiteUrl?: string } = {};
      result.error.issues.forEach((issue) => { const path = issue.path[0] as 'name' | 'websiteUrl'; if (path && !errors[path]) errors[path] = issue.message; });
      setFieldErrors(errors); setLoading(false); return;
    }
    try {
      const res = await createProjectAction({ name, websiteUrl });
      if (!res.success) { setGeneralError(res.error || 'We could not create this project.'); toast.error(res.error || 'We could not create this project.'); setLoading(false); return; }
      toast.success(`Project '${name}' created successfully.`); onSuccess?.(); router.push(redirectOnSuccess); router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setGeneralError(msg); toast.error(msg); setLoading(false);
    }
  };

  let domainPreview = '';
  if (websiteUrl) { try { domainPreview = extractDomainName(websiteUrl); } catch { domainPreview = ''; } }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {generalError && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{generalError}</span></div>}

      <div className="space-y-2">
        <label htmlFor="project-name" className="block text-sm font-semibold text-slate-900">Project name</label>
        <input id="project-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corporation" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
        {fieldErrors.name ? <p className="text-xs font-medium text-red-600">{fieldErrors.name}</p> : <p className="text-xs text-slate-500">Use the brand or company name your team will recognize.</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="website-url" className="block text-sm font-semibold text-slate-900">Website</label>
        <div className="relative"><Globe2 className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input id="website-url" type="url" required value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100" /></div>
        {fieldErrors.websiteUrl ? <p className="text-xs font-medium text-red-600">{fieldErrors.websiteUrl}</p> : <p className="text-xs text-slate-500">Use the canonical HTTPS address. {domainPreview && <span className="font-medium text-slate-700">We’ll track <code className="rounded-md bg-slate-100 px-1.5 py-0.5">{domainPreview}</code>.</span>}</p>}
      </div>

      {domainPreview && !fieldErrors.websiteUrl && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ready to create</div><p className="mt-1 pl-6 text-xs text-slate-500">Your project will use {domainPreview} as its starting domain.</p></div>}

      <div className="flex items-center justify-end border-t border-slate-100 pt-5">
        <Button type="submit" disabled={loading} className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating project</> : <>Create project <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}
