'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Building, Loader2 } from 'lucide-react';
import { addCompetitorAction } from '@/app/(dashboard)/competitors/actions';
import { toast } from 'sonner';

interface AddCompetitorModalProps {
  projectId: string;
  onCompetitorAdded?: () => void;
}

export function AddCompetitorModal({ projectId, onCompetitorAdded }: AddCompetitorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !websiteUrl.trim()) {
      setError('Please provide both company name and website URL.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await addCompetitorAction({
      projectId,
      name: name.trim(),
      websiteUrl: websiteUrl.trim(),
    });

    setIsLoading(false);

    if (res.success) {
      toast.success(`Competitor '${name}' successfully tracked!`);
      setName('');
      setWebsiteUrl('');
      setIsOpen(false);
      onCompetitorAdded?.();
    } else {
      setError(res.error || 'Failed to add competitor.');
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800">
        <Plus className="h-4 w-4" />
        Add Competitor
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Track New Competitor</h3>
                  <p className="text-xs text-slate-500">Explicitly confirm brand name & domain</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Company / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Competitor Domain / Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://acme.com or acme.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Domain will be normalized automatically (e.g., https://acme.com/path → acme.com).
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading} className="bg-slate-900 text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Confirm & Track'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
