'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateReportAction, getReportsData, type ReportListItem } from './actions';

export function ReportsClientView({ projectId, initialReports, initialError }: { projectId: string; initialReports: ReportListItem[]; initialError?: string }) {
  const [reports, setReports] = useState(initialReports);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateReportAction(projectId);
      if (!result.success || !result.data) { toast.error(result.error || 'Report generation failed.'); return; }
      const blob = new Blob([result.data.content], { type: result.data.contentType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.data.fileName; anchor.click(); URL.revokeObjectURL(url);
      toast.success('Report generated and downloaded.');
      const refreshed = await getReportsData(projectId);
      if (refreshed.success && refreshed.data) setReports(refreshed.data.reports);
    } catch { toast.error('Report generation failed.'); }
    finally { setGenerating(false); }
  };

  return <div className="space-y-6 pb-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e4e9] pb-5">
      <div><div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500"><FileText className="h-4 w-4" /><span>REPORTING</span></div><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Reports</h1><p className="mt-1 text-xs text-slate-600">Generate an evidence-backed HTML snapshot from the current dashboard data.</p></div>
      <Button onClick={generate} disabled={generating} className="gap-2 bg-slate-950 text-white hover:bg-slate-800 text-xs h-8">{generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{generating ? 'Generating...' : 'Generate Report'}</Button>
    </div>
    {initialError && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{initialError}</div>}
    <div className="rounded-lg border border-[#e2e4e9] bg-white overflow-hidden"><div className="border-b border-[#e2e4e9] bg-[#faf9f6] p-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">REPORT HISTORY</div><div className="divide-y divide-[#e2e4e9]">{reports.map((report) => <div key={report.id} className="flex items-center justify-between p-4"><div><div className="text-xs font-bold text-slate-950">{report.reportType.replaceAll('_', ' ')}</div><div className="text-[11px] text-slate-500 mt-1">{new Date(report.createdAt).toLocaleString()} · {report.fileFormat.toUpperCase()} · {report.status}</div></div><span className="font-mono text-[10px] text-slate-400">{report.fileSizeBytes ? `${Math.round(report.fileSizeBytes / 1024)} KB` : '—'}</span></div>)}{reports.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No reports generated yet.</div>}</div></div>
  </div>;
}
