'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Folder, Globe, Calendar, Pencil, ShieldCheck, Settings2 } from 'lucide-react';
import { DeleteProjectModal } from '@/components/projects/delete-project-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';

interface SettingsClientViewProps { project: { id: string; name: string; createdAt: string; primaryDomain: string | null } }

export function SettingsClientView({ project }: SettingsClientViewProps) {
  const [currentName, setCurrentName] = useState(project.name);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-7"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><Settings2 className="h-4 w-4" /> Project configuration</div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Settings</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Keep your project identity and workspace configuration accurate. Changes apply only to this project.</p></header>

      <section><div className="mb-4"><h2 className="text-sm font-semibold text-slate-950">Project details</h2><p className="mt-1 text-xs text-slate-500">Core information used throughout your visibility reports.</p></div><div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Folder className="h-4 w-4" />Project name</CardDescription><CardTitle className="truncate text-base text-slate-950">{currentName}</CardTitle></CardHeader><CardContent><Button variant="outline" size="sm" onClick={()=>setIsEditOpen(true)} className="border-slate-200"><Pencil className="mr-2 h-3.5 w-3.5" />Edit name</Button></CardContent></Card>
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Globe className="h-4 w-4" />Primary domain</CardDescription><CardTitle className="truncate text-base text-slate-950">{project.primaryDomain || 'Not configured'}</CardTitle></CardHeader><CardContent><p className="text-xs text-slate-500">Your monitored web property.</p></CardContent></Card>
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Created</CardDescription><CardTitle className="text-base text-slate-950">{formattedDate}</CardTitle></CardHeader><CardContent><p className="text-xs text-slate-500">Project creation date.</p></CardContent></Card>
      </div></section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"><ShieldCheck className="h-4 w-4" /></div><div><h2 className="text-sm font-semibold text-slate-950">Project safety</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Destructive project actions are intentionally separated from everyday configuration. Your scans and evidence remain protected by the project access rules.</p></div></div></section>

      <section className="rounded-2xl border border-red-200 bg-white"><div className="border-b border-red-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-red-700">Danger zone</h2><p className="mt-1 text-xs text-slate-500">Irreversible actions. Review carefully before continuing.</p></div><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-sm font-semibold text-slate-950">Delete this project</p><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Soft-delete this project and remove it from your active workspace. This does not delete your account.</p></div><Button variant="outline" onClick={()=>setIsDeleteOpen(true)} className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"><Trash2 className="mr-2 h-4 w-4" />Delete project</Button></div></section>

      <EditProjectModal isOpen={isEditOpen} onClose={()=>setIsEditOpen(false)} projectId={project.id} currentName={currentName} onSuccess={setCurrentName} />
      <DeleteProjectModal isOpen={isDeleteOpen} onClose={()=>setIsDeleteOpen(false)} projectId={project.id} projectName={currentName} />
    </div>
  );
}
