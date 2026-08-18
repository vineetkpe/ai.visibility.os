'use server';

import { createClient } from '@/lib/supabase/server';

export interface ReportListItem { id: string; reportType: string; status: string; fileFormat: string; createdAt: string; generatedAt: string | null; fileSizeBytes: number | null; }
export interface ReportResult { id: string; fileName: string; contentType: 'text/html'; content: string; }

async function getOwnedProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId?: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Authentication required.');
  let query = supabase.from('projects').select('id, name, domains(host, is_primary)').eq('user_id', user.id).is('deleted_at', null);
  if (projectId) query = query.eq('id', projectId); else query = query.order('created_at', { ascending: false }).limit(1);
  const { data: projects, error } = await query;
  if (error) throw new Error(error.message);
  const project = projects?.[0];
  if (!project) throw new Error('Project not found.');
  return project;
}

export async function getReportsData(projectId?: string): Promise<{ success: boolean; data?: { projectId: string; reports: ReportListItem[] }; error?: string }> {
  try {
    const supabase = await createClient();
    const project = await getOwnedProject(supabase, projectId);
    const { data, error } = await supabase.from('reports').select('id, report_type, status, file_format, created_at, generated_at, file_size_bytes').eq('project_id', project.id).order('created_at', { ascending: false }).limit(25);
    if (error) throw new Error(error.message);
    return { success: true, data: { projectId: project.id, reports: (data || []).map((r) => ({ id: r.id, reportType: r.report_type, status: r.status, fileFormat: r.file_format, createdAt: r.created_at, generatedAt: r.generated_at, fileSizeBytes: r.file_size_bytes })) } };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Failed to load reports.' }; }
}

export async function generateReportAction(projectId: string): Promise<{ success: boolean; data?: ReportResult; error?: string }> {
  try {
    const supabase = await createClient();
    const project = await getOwnedProject(supabase, projectId);
    const primaryDomain = project.domains?.find((d) => d.is_primary)?.host || project.domains?.[0]?.host || 'Not configured';

    const [{ data: scans, error: scansError }, { data: recs, error: recsError }, { data: pages, error: pagesError }] = await Promise.all([
      supabase.from('ai_scans').select('id, model_name, is_mentioned, sentiment, mention_position, status, completed_at').eq('project_id', project.id).order('completed_at', { ascending: false }).limit(100),
      supabase.from('recommendations').select('title, category, priority, status, description').eq('project_id', project.id).is('superseded_by', null).order('created_at', { ascending: false }).limit(100),
      supabase.from('pages').select('id, status_code, page_metadata(title, meta_description, schema_json)').in('domain_id', (project.domains || []).map((d) => d.id)),
    ]);
    if (scansError) throw new Error(scansError.message);
    if (recsError) throw new Error(recsError.message);
    if (pagesError) throw new Error(pagesError.message);

    const completed = (scans || []).filter((s) => s.status === 'completed');
    const mentionRate = completed.length ? Math.round((completed.filter((s) => s.is_mentioned).length / completed.length) * 100) : null;
    const positiveRate = completed.filter((s) => s.sentiment).length ? Math.round((completed.filter((s) => s.sentiment === 'positive').length / completed.filter((s) => s.sentiment).length) * 100) : null;
    const pageList = pages || [];
    const schemaCoverage = pageList.length ? Math.round((pageList.filter((p) => { const m = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata; return Boolean(m?.schema_json); }).length / pageList.length) * 100) : 0;
    const metadataCoverage = pageList.length ? Math.round((pageList.filter((p) => { const m = Array.isArray(p.page_metadata) ? p.page_metadata[0] : p.page_metadata; return Boolean(m?.title?.trim() && m?.meta_description?.trim()); }).length / pageList.length) * 100) : 0;
    const openRecs = (recs || []).filter((r) => r.status === 'open' || r.status === 'in_progress');

    const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
    const generatedAt = new Date().toISOString();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>AI Visibility Report - ${esc(project.name)}</title><style>body{font-family:Arial,sans-serif;max-width:960px;margin:40px auto;padding:0 24px;color:#111827}h1,h2{color:#0f172a}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border:1px solid #e5e7eb;border-radius:8px;padding:16px}.muted{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:9px;font-size:13px}</style></head><body><h1>AI Visibility Report</h1><p class="muted">${esc(project.name)} · ${esc(primaryDomain)} · Generated ${esc(generatedAt)}</p><div class="grid"><div class="card"><strong>${mentionRate ?? '—'}%</strong><div class="muted">Mention rate</div></div><div class="card"><strong>${positiveRate ?? '—'}%</strong><div class="muted">Positive sentiment</div></div><div class="card"><strong>${completed.length}</strong><div class="muted">Completed scans</div></div><div class="card"><strong>${pageList.length}</strong><div class="muted">Crawled pages</div></div></div><h2>Website health</h2><p>Schema coverage: <strong>${schemaCoverage}%</strong> · Metadata coverage: <strong>${metadataCoverage}%</strong></p><h2>Open recommendations (${openRecs.length})</h2><table><thead><tr><th>Priority</th><th>Category</th><th>Recommendation</th></tr></thead><tbody>${openRecs.map((r) => `<tr><td>${esc(r.priority)}</td><td>${esc(r.category)}</td><td>${esc(r.title)}</td></tr>`).join('') || '<tr><td colspan="3">No open recommendations.</td></tr>'}</tbody></table><h2>Recent scans</h2><table><thead><tr><th>Model</th><th>Status</th><th>Mentioned</th><th>Completed</th></tr></thead><tbody>${completed.slice(0, 20).map((s) => `<tr><td>${esc(s.model_name)}</td><td>${esc(s.status)}</td><td>${s.is_mentioned ? 'Yes' : 'No'}</td><td>${esc(s.completed_at)}</td></tr>`).join('') || '<tr><td colspan="4">No completed scans yet.</td></tr>'}</tbody></table></body></html>`;

    const { data: report, error: reportError } = await supabase.from('reports').insert({ project_id: project.id, report_type: 'visibility_overview', status: 'completed', file_format: 'html', report_version: 1, generated_at: generatedAt, file_size_bytes: Buffer.byteLength(html, 'utf8') }).select('id').single();
    if (reportError || !report) throw new Error(reportError?.message || 'Failed to persist report record.');

    return { success: true, data: { id: report.id, fileName: `ai-visibility-report-${report.id.slice(0, 8)}.html`, contentType: 'text/html', content: html } };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Failed to generate report.' }; }
}
