-- Migration: 0010_jobs_audit_reports.sql
-- Description: Creates Jobs, Audit Logs & Reports schema (report_status, report_file_format enums, jobs table with retry visibility, immutable audit_logs table, reports table with scan traceability, indexes, and RLS policies).
-- Idempotent: Safe to execute on fresh schema following 0009_competitors_recommendations.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');
CREATE TYPE public.report_file_format AS ENUM ('pdf', 'html', 'json');

-- -----------------------------------------------------------------------------
-- 2. JOBS TABLE & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status public.crawl_status NOT NULL DEFAULT 'queued',
    resource_type VARCHAR(50) NULL,
    resource_id UUID NULL,
    trigger_run_id VARCHAR(255) NULL,
    progress JSONB NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_jobs PRIMARY KEY (id),
    CONSTRAINT fk_jobs_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_jobs_retry_bounds CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT chk_jobs_max_retries CHECK (max_retries >= 0)
);

CREATE TRIGGER trg_jobs_set_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NULL,
    actor_user_id UUID NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id UUID NULL,
    metadata JSONB NULL,
    ip_address INET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 4. REPORTS TABLE & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    scan_id UUID NULL,
    report_type VARCHAR(100) NOT NULL,
    status public.report_status NOT NULL DEFAULT 'pending',
    file_format public.report_file_format NOT NULL DEFAULT 'pdf',
    report_version INTEGER NOT NULL DEFAULT 1,
    date_range_start DATE NULL,
    date_range_end DATE NULL,
    file_path TEXT NULL,
    file_size_bytes INTEGER NULL,
    generated_at TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT fk_reports_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_scan FOREIGN KEY (scan_id) REFERENCES public.ai_scans(id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_date_range CHECK (date_range_start IS NULL OR date_range_end IS NULL OR date_range_end >= date_range_start),
    CONSTRAINT chk_reports_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    CONSTRAINT chk_reports_version CHECK (report_version >= 1)
);

CREATE TRIGGER trg_reports_set_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_type ON public.jobs(job_type);

CREATE INDEX idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE INDEX idx_reports_project_id ON public.reports(project_id);
CREATE INDEX idx_reports_scan_id ON public.reports(scan_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

-- jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_select_own ON public.jobs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = jobs.project_id AND p.user_id = auth.uid()));

CREATE POLICY jobs_insert_own ON public.jobs FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = jobs.project_id AND p.user_id = auth.uid()));

CREATE POLICY jobs_update_own ON public.jobs FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = jobs.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = jobs.project_id AND p.user_id = auth.uid()));

-- audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_own ON public.audit_logs FOR SELECT
    USING (
        (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = audit_logs.project_id AND p.user_id = auth.uid()))
        OR (actor_user_id IS NOT NULL AND actor_user_id = auth.uid())
    );

CREATE POLICY audit_logs_insert_own ON public.audit_logs FOR INSERT
    WITH CHECK (
        (project_id IS NULL OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = audit_logs.project_id AND p.user_id = auth.uid()))
        AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
    );

-- reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_own ON public.reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = reports.project_id AND p.user_id = auth.uid()));

CREATE POLICY reports_insert_own ON public.reports FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = reports.project_id AND p.user_id = auth.uid()));

CREATE POLICY reports_update_own ON public.reports FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = reports.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = reports.project_id AND p.user_id = auth.uid()));

CREATE POLICY reports_delete_own ON public.reports FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = reports.project_id AND p.user_id = auth.uid()));
