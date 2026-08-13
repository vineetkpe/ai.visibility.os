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
  const [activeTab, setActiveTab] = useState<'general' | 'engines' | 'security' | 'danger'>('general');

  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#e2e4e9] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          <Settings2 className="h-4 w-4 text-amber-600" />
          <span>WORKSPACE CONFIGURATION</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          Project & Engine Settings
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Manage target domain credentials, AI engine sampling policies, and project security controls.
        </p>
      </div>

      {/* Two-Column Settings Layout */}
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Left Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-left transition-colors ${
              activeTab === 'general'
                ? 'bg-slate-950 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Workspace Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('engines')}
            className={`w-full flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-left transition-colors ${
              activeTab === 'engines'
                ? 'bg-slate-950 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>AI Provider Nodes</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-left transition-colors ${
              activeTab === 'security'
                ? 'bg-slate-950 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security & Auth</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`w-full flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-left transition-colors ${
              activeTab === 'danger'
                ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Danger Zone</span>
          </button>
        </nav>

        {/* Right Content Area */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Project Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Primary attributes used in report headers and prompt contexts.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-[#e2e4e9] bg-[#faf9f6] p-3.5">
                  <div className="text-[11px] font-mono text-slate-500 mb-1">PROJECT NAME</div>
                  <div className="text-sm font-bold text-slate-950 truncate mb-3">{currentName}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    className="h-7 text-xs font-semibold border-[#e2e4e9]"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Rename Project
                  </Button>
                </div>

                <div className="rounded border border-[#e2e4e9] bg-[#faf9f6] p-3.5">
                  <div className="text-[11px] font-mono text-slate-500 mb-1">PRIMARY DOMAIN TARGET</div>
                  <div className="text-sm font-mono font-bold text-slate-950 truncate mb-1">
                    {project.primaryDomain || 'Not configured'}
                  </div>
                  <p className="text-[11px] text-slate-500">Monitored web property node</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2e4e9] text-xs text-slate-600 font-mono">
                <span>Created on: {formattedDate}</span>
              </div>
            </div>
          )}

          {activeTab === 'engines' && (
            <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-950">AI Search Engine Registries</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configured sampling endpoints for synthetic buyer intent scans.</p>
              </div>

              <div className="divide-y divide-[#e2e4e9] border border-[#e2e4e9] rounded">
                {[
                  { name: 'ChatGPT (OpenAI Search)', status: 'Active', latency: '420ms' },
                  { name: 'Google Gemini 1.5 Pro', status: 'Active', latency: '380ms' },
                  { name: 'Claude 3.5 Sonnet', status: 'Active', latency: '350ms' },
                  { name: 'Perplexity Pro', status: 'Active', latency: '490ms' },
                ].map((engine) => (
                  <div key={engine.name} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-950">{engine.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">Avg Latency: {engine.latency}</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {engine.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-lg border border-[#e2e4e9] bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-950">Security & Isolation</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your workspace scans use zero-retention API endpoints. AI providers are strictly barred from training model weights on synthetic prompt payloads executed by AI Visibility OS.
              </p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="rounded-lg border border-red-200 bg-white p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-red-700">Delete Brand Project</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Soft-delete this project and remove it from your active workspace. Scan history data remains archived securely.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Project
              </Button>
            </div>
          )}
        </div>
      </div>

      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        projectId={project.id}
        currentName={currentName}
        onSuccess={setCurrentName}
      />
      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        projectId={project.id}
        projectName={currentName}
      />
    </div>
  );
}
