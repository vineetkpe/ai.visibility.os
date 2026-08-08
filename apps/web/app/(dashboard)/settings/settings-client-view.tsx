'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Folder, Globe, Calendar, Pencil } from 'lucide-react';
import { DeleteProjectModal } from '@/components/projects/delete-project-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';

interface SettingsClientViewProps {
  project: {
    id: string;
    name: string;
    createdAt: string;
    primaryDomain: string | null;
  };
}

export function SettingsClientView({ project }: SettingsClientViewProps) {
  const [currentName, setCurrentName] = useState(project.name);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* General Project Settings Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Project Overview</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Configuration and metadata for the current active project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center space-x-3 overflow-hidden">
                <Folder className="h-5 w-5 text-slate-500 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-slate-500">Project Name</div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{currentName}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditOpen(true)}
                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 shrink-0"
                title="Edit Project Name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <Globe className="h-5 w-5 text-slate-500 shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Primary Domain</div>
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {project.primaryDomain || 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <Calendar className="h-5 w-5 text-slate-500 shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Created On</div>
                <div className="text-sm font-semibold text-slate-900 truncate">{formattedDate}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 bg-red-50/20 shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-700">Danger Zone</CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Irreversible and destructive actions for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-red-200">
            <div>
              <div className="text-sm font-semibold text-slate-900">Delete this project</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Soft-delete this project and remove it from your active workspace.
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Project Name Modal */}
      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        projectId={project.id}
        currentName={currentName}
        onSuccess={(newName) => setCurrentName(newName)}
      />

      {/* Confirmation Modal */}
      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        projectId={project.id}
        projectName={currentName}
      />
    </div>
  );
}
