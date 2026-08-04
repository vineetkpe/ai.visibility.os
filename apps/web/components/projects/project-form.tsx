'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createProjectAction } from '@/app/(dashboard)/projects/actions';
import { createProjectSchema, extractDomainName } from '@ai-visibility-os/shared';
import { Globe, FolderPlus, AlertCircle } from 'lucide-react';

export interface ProjectFormProps {
  redirectOnSuccess?: string;
  onSuccess?: () => void;
}

export function ProjectForm({ redirectOnSuccess = '/dashboard', onSuccess }: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; websiteUrl?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setGeneralError(null);

    // Client-side Zod validation
    const result = createProjectSchema.safeParse({ name, websiteUrl });
    if (!result.success) {
      const errors: { name?: string; websiteUrl?: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as 'name' | 'websiteUrl';
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await createProjectAction({ name, websiteUrl });
      if (!res.success) {
        setGeneralError(res.error || 'Failed to create project.');
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }

      router.push(redirectOnSuccess);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setGeneralError(msg);
      setLoading(false);
    }
  };

  // Preview extracted domain dynamically as user types valid URL
  let domainPreview = '';
  if (websiteUrl) {
    try {
      domainPreview = extractDomainName(websiteUrl);
    } catch {
      domainPreview = '';
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="flex items-start gap-2.5 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Project Name Field */}
      <div className="space-y-1.5">
        <label htmlFor="project-name" className="text-xs font-medium text-slate-700">
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Corporation"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
        />
        {fieldErrors.name && (
          <p className="text-[11px] font-medium text-red-600">{fieldErrors.name}</p>
        )}
      </div>

      {/* Website URL Field */}
      <div className="space-y-1.5">
        <label htmlFor="website-url" className="text-xs font-medium text-slate-700">
          Website URL
        </label>
        <div className="relative">
          <input
            id="website-url"
            type="url"
            required
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-md border border-slate-200 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
          />
          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
        {fieldErrors.websiteUrl ? (
          <p className="text-[11px] font-medium text-red-600">{fieldErrors.websiteUrl}</p>
        ) : (
          <p className="text-[11px] text-slate-500">
            Must be a valid HTTPS URL.{' '}
            {domainPreview && (
              <span className="text-slate-700 font-medium">
                Domain extracted: <code className="rounded bg-slate-100 px-1 py-0.5">{domainPreview}</code>
              </span>
            )}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full text-xs gap-2 mt-2" disabled={loading}>
        <FolderPlus className="h-4 w-4" />
        {loading ? 'Creating Project...' : 'Create Project'}
      </Button>
    </form>
  );
}
