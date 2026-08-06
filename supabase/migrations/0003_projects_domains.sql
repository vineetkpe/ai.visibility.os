-- Migration: 0003_projects_domains.sql
-- Description: Creates projects and domains foundation tables, constraints, partial indexes, triggers, and RLS policies.
-- Idempotent: Safe to execute on fresh schema following 0002_users_profile.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.project_status AS ENUM ('active', 'archived');

-- -----------------------------------------------------------------------------
-- 2. PROJECTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    industry VARCHAR(100) NULL,
    status public.project_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_projects_user_slug UNIQUE (user_id, slug)
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE TRIGGER trg_projects_set_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Projects RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_own
    ON public.projects
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY projects_insert_own
    ON public.projects
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY projects_update_own
    ON public.projects
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Note: No DELETE policy is defined. Hard DELETE is forbidden; deletion is soft via UPDATE deleted_at = now().

-- -----------------------------------------------------------------------------
-- 3. DOMAINS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.domains (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    host VARCHAR(255) NOT NULL,
    scheme VARCHAR(10) NOT NULL DEFAULT 'https',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method VARCHAR(50) NULL,
    verification_token TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT pk_domains PRIMARY KEY (id),
    CONSTRAINT fk_domains_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_domains_project_host UNIQUE (project_id, host),
    CONSTRAINT chk_domains_scheme CHECK (scheme IN ('http', 'https')),
    CONSTRAINT chk_domains_host_format CHECK (host = lower(host) AND host !~ '^https?://' AND host NOT LIKE '%/')
);

-- Partial Unique Index: Enforces exactly one primary domain per project at DB level
CREATE UNIQUE INDEX uq_domains_project_primary ON public.domains(project_id) WHERE is_primary = TRUE;

CREATE INDEX idx_domains_project_id ON public.domains(project_id);
CREATE INDEX idx_domains_host ON public.domains(host);

CREATE TRIGGER trg_domains_set_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Domains RLS Policies (Joins through projects via EXISTS)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY domains_select_own
    ON public.domains
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));

CREATE POLICY domains_insert_own
    ON public.domains
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));

CREATE POLICY domains_update_own
    ON public.domains
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));

-- Note: No DELETE policy is defined. Hard DELETE is forbidden; deletion is soft via UPDATE deleted_at = now().
