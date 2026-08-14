import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Plus, Search, FolderKanban, Globe, ArrowUpRight, Play, Shield, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Projects Registry | AI Visibility OS',
  description: 'Manage brand portfolios, primary domain targets, and visibility scan schedules.',
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fprojects');
  }

  // Fetch projects for user
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch primary domains for these projects
  const projectIds = projects?.map((p) => p.id) || [];
  let domainsMap: Record<string, string> = {};

  if (projectIds.length > 0) {
    const { data: domains } = await supabase
      .from('domains')
      .select('project_id, host')
      .in('project_id', projectIds)
      .eq('is_primary', true);

    if (domains) {
      domainsMap = (domains as any[]).reduce((acc, d) => {
        if (d.project_id && d.host) acc[d.project_id] = d.host;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return (
    <PageContainer title="" description="">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                PORTFOLIO DIRECTORY
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Brand Projects & Domains
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Active domain targets continuously monitored across AI search engine registries.
            </p>
          </div>
          <Button
            asChild
            className="inline-flex items-center gap-1.5 bg-slate-950 text-white hover:bg-slate-800 font-semibold border border-slate-900 text-xs px-3.5 h-8 shadow-2xs shrink-0"
          >
            <Link href="/projects/new">
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Create Project</span>
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#e2e4e9] bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 max-w-md rounded border border-[#e2e4e9] bg-[#faf9f6] px-2.5 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search projects or target domains..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded border border-[#e2e4e9] bg-[#faf9f6] px-2.5 py-1.5 text-xs text-slate-600 font-mono">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Status: Active</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total: <strong>{projects?.length || 0}</strong>
            </span>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block rounded-lg border border-[#e2e4e9] bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e2e4e9] bg-[#faf9f6] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Primary Domain</th>
                <th className="px-4 py-3">Visibility Score</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e4e9]">
              {projects && projects.length > 0 ? (
                projects.map((project) => {
                  const domain = domainsMap[project.id] || '—';
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-950">
                        <Link
                          href={`/dashboard?projectId=${project.id}`}
                          className="hover:text-amber-700 transition-colors flex items-center gap-2"
                        >
                          <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{project.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{domain}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-900 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          78 / 100
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard?projectId=${project.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950 hover:underline"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-500">
                    No projects found. Create your first brand project to begin synthetic prompt audits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Records */}
        <div className="md:hidden space-y-3">
          {projects && projects.length > 0 ? (
            projects.map((project) => {
              const domain = domainsMap[project.id] || '—';
              return (
                <div key={project.id} className="rounded-lg border border-[#e2e4e9] bg-white p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-950 text-sm">{project.name}</div>
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 border border-amber-200">
                      78 / 100
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span>{domain}</span>
                  </div>
                  <div className="pt-2 border-t border-[#e2e4e9] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/dashboard?projectId=${project.id}`}
                      className="font-semibold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-[#e2e4e9] bg-white p-6 text-center text-xs text-slate-500">
              No projects found.
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
