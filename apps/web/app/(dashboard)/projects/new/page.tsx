import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProjectForm } from '@/components/projects/project-form';

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Fprojects%2Fnew');
  }

  return (
    <PageContainer
      title="Create New Project"
      description="Add a new project and web domain to track AI visibility."
    >
      <div className="mx-auto max-w-xl py-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Project Details</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Provide a name and website URL for your new project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm redirectOnSuccess="/dashboard" />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
