'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteProjectAction } from '@/app/(dashboard)/projects/actions';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: DeleteProjectModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmName.trim() === projectName.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      const res = await deleteProjectAction(projectId);

      if (!res.success) {
        toast.error(res.error || 'Failed to delete project.');
        setIsDeleting(false);
        return;
      }

      toast.success('Project deleted successfully.');
      onClose();
      // Redirect to onboarding page for single-active-project model
      window.location.href = '/onboarding';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during deletion.';
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-labelledby="del-proj-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 id="del-proj-title" className="text-lg font-semibold text-slate-900">Delete Project</h3>
            <p className="text-xs text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <span className="font-semibold text-slate-900">&quot;{projectName}&quot;</span>?
          This will hide the project from your dashboard. Historical data remains securely preserved in the database audit log.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label htmlFor="delete-confirm-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Type <span className="font-mono font-bold text-slate-900 select-all">{projectName}</span> to confirm:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={projectName}
              disabled={isDeleting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
