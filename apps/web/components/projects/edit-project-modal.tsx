'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateProjectAction } from '@/app/(dashboard)/projects/actions';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentName: string;
  onSuccess?: (newName: string) => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  projectId,
  currentName,
  onSuccess,
}: EditProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await updateProjectAction(projectId, trimmedName);

      if (!res.success) {
        toast.error(res.error || 'Failed to update project name.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Project name updated successfully.');
      setIsSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess(trimmedName);
      }
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while updating.';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-labelledby="edit-proj-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 text-slate-900 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
            <Pencil className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h3 id="edit-proj-title" className="text-lg font-semibold text-slate-900">Edit Project Name</h3>
            <p className="text-xs text-slate-500">Update the display name of your project.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-project-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Project Name
            </label>
            <input
              id="edit-project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Product Website"
              disabled={isSubmitting}
              required
              maxLength={255}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 disabled:opacity-50"
            />
          </div>

          <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Primary domain URL is read-only to preserve existing website crawls, AI scan records, and business context history.
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName || isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
