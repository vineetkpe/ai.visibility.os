import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { getScanHistoryData } from '../actions';
import { ScansPremiumClientView } from './scans-premium-client-view';

export const metadata = { title: 'Scan History | AI Visibility OS', description: 'Evidence-backed AI visibility scan history.' };

interface PageProps { searchParams: Promise<{ projectId?: string; project_id?: string }> }

export default async function ScansHistoryPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login?redirect=%2Fdashboard%2Fscans');
  const params = await searchParams;
  const requestedProjectId = params.projectId || params.project_id;
  let query = supabase.from('projects').select('id').eq('user_id', user.id).is('deleted_at', null);
  if (requestedProjectId) query = query.eq('id', requestedProjectId);
  else query = query.order('created_at', { ascending: false }).limit(1);
  const { data: project } = await query.maybeSingle();
  if (!project) redirect('/onboarding');
  const result = await getScanHistoryData(project.id);
  const initialScans = result.success && result.data ? result.data.scans : [];
  return <PageContainer title="" description=""><ScansPremiumClientView projectId={project.id} initialScans={initialScans} /></PageContainer>;
}
