import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Play, FolderPlus, Sparkles } from 'lucide-react';

interface DomainRecord {
  id: string;
  domain_name: string;
  is_primary: boolean;
  status: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  created_at: string;
  domains?: DomainRecord[];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=%2Fdashboard');
  }

  // Fetch projects and primary domains for the authenticated user
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, name, created_at, domains(id, domain_name, is_primary, status)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const projects = (projectsData ?? []) as ProjectRecord[];
  const hasProjects = projects.length > 0;

  return (
    <PageContainer
      title="Dashboard"
      description="Monitor and manage your AI search engine visibility projects."
      action={
        hasProjects ? (
          <Button asChild size="sm">
            <Link href="/projects/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Project
            </Link>
          </Button>
        ) : null
      }
    >
      {!hasProjects ? (
        /* Empty State when no project exists */
        <EmptyState
          icon={<FolderPlus className="h-7 w-7 text-slate-400" />}
          title="No projects configured"
          description="Add your first website project to begin tracking AI model visibility and brand citations."
          action={
            <Button asChild variant="outline">
              <Link href="/onboarding">Get Started with Onboarding</Link>
            </Button>
          }
        />
      ) : (
        /* Dashboard view when project(s) exist */
        <div className="space-y-8">
          {/* Section 1: Welcome Banner */}
          <Card className="border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xs">
            <CardHeader className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>AI Visibility OS Workspace</span>
              </div>
              <CardTitle className="text-xl text-white">
                Welcome back, {user.user_metadata?.full_name || user.email}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Your workspace is configured with {projects.length}{' '}
                {projects.length === 1 ? 'project' : 'projects'}. AI engine scanning features are ready for execution.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Section 2: Project Overview */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Project Overview</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => {
                const primaryDomain = proj.domains?.find((d) => d.is_primary) || proj.domains?.[0];
                return (
                  <Card key={proj.id} className="border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors">
                    <CardHeader className="space-y-1 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base truncate">{proj.name}</CardTitle>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60">
                          Active
                        </span>
                      </div>
                      {primaryDomain ? (
                        <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-700 truncate">
                            {primaryDomain.domain_name}
                          </span>
                        </CardDescription>
                      ) : (
                        <CardDescription className="text-xs text-slate-400">
                          No domain configured
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 text-[11px] text-slate-400">
                      Added on {new Date(proj.created_at).toLocaleDateString()}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 3: Start First Scan (Coming Soon) */}
          <Card className="border-slate-200 bg-slate-50/50 shadow-xs">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base text-slate-900">AI Visibility Scanning</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Trigger automated prompt evaluations across ChatGPT, Perplexity, Claude, and Gemini engines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled variant="secondary" className="gap-2 text-xs opacity-60 cursor-not-allowed">
                <Play className="h-4 w-4" />
                Start First Scan (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
