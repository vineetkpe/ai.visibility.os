-- Migration: 0004_website_discovery.sql
-- Description: Creates crawler & website discovery engine tables (crawl_sessions, pages, page_metadata, robots_files, sitemaps, crawl_errors), composite constraints, triggers, and RLS policies.
-- Idempotent: Safe to execute on fresh schema following 0003_projects_domains.sql.

-- -----------------------------------------------------------------------------
-- 1. PREREQUISITE DOMAINS CONSTRAINT & ENUMS
-- -----------------------------------------------------------------------------

-- Enable composite foreign key from pages (domain_id, project_id) -> domains(id, project_id)
ALTER TABLE public.domains ADD CONSTRAINT uq_domains_id_project UNIQUE (id, project_id);

CREATE TYPE public.crawl_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. CRAWL SESSIONS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.crawl_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    status public.crawl_status NOT NULL DEFAULT 'queued',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    pages_discovered INTEGER NOT NULL DEFAULT 0,
    pages_crawled INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_crawl_sessions PRIMARY KEY (id),
    CONSTRAINT fk_crawl_sessions_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_crawl_sessions_counts CHECK (pages_discovered >= 0 AND pages_crawled >= 0 AND error_count >= 0)
);

CREATE INDEX idx_crawl_sessions_project_id ON public.crawl_sessions(project_id);
CREATE INDEX idx_crawl_sessions_status ON public.crawl_sessions(status);

CREATE TRIGGER trg_crawl_sessions_set_updated_at
    BEFORE UPDATE ON public.crawl_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crawl_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawl_sessions_select_own ON public.crawl_sessions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = crawl_sessions.project_id AND p.user_id = auth.uid()));

CREATE POLICY crawl_sessions_insert_own ON public.crawl_sessions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = crawl_sessions.project_id AND p.user_id = auth.uid()));

CREATE POLICY crawl_sessions_update_own ON public.crawl_sessions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = crawl_sessions.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = crawl_sessions.project_id AND p.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3. PAGES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.pages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    domain_id UUID NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NULL,
    content_type VARCHAR(100) NULL,
    last_crawled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_pages PRIMARY KEY (id),
    CONSTRAINT fk_pages_domain_project FOREIGN KEY (domain_id, project_id) REFERENCES public.domains(id, project_id) ON DELETE CASCADE,
    CONSTRAINT uq_pages_project_url UNIQUE (project_id, url),
    CONSTRAINT chk_pages_url_format CHECK (url ~ '^https?://'),
    CONSTRAINT chk_pages_status_code CHECK (status_code IS NULL OR (status_code BETWEEN 100 AND 599))
);

CREATE INDEX idx_pages_project_id ON public.pages(project_id);
CREATE INDEX idx_pages_domain_id ON public.pages(domain_id);

CREATE TRIGGER trg_pages_set_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pages_select_own ON public.pages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pages.project_id AND p.user_id = auth.uid()));

CREATE POLICY pages_insert_own ON public.pages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pages.project_id AND p.user_id = auth.uid()));

CREATE POLICY pages_update_own ON public.pages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pages.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pages.project_id AND p.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 4. PAGE METADATA TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.page_metadata (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL,
    title TEXT NULL,
    meta_description TEXT NULL,
    canonical_url TEXT NULL,
    language VARCHAR(20) NULL,
    schema_json JSONB NULL,
    open_graph JSONB NULL,
    twitter_cards JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_page_metadata PRIMARY KEY (id),
    CONSTRAINT fk_page_metadata_page FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE,
    CONSTRAINT uq_page_metadata_page UNIQUE (page_id)
);

CREATE INDEX idx_page_metadata_page_id ON public.page_metadata(page_id);

CREATE TRIGGER trg_page_metadata_set_updated_at
    BEFORE UPDATE ON public.page_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.page_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_metadata_select_own ON public.page_metadata FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.pages pg JOIN public.projects p ON p.id = pg.project_id WHERE pg.id = page_metadata.page_id AND p.user_id = auth.uid()));

CREATE POLICY page_metadata_insert_own ON public.page_metadata FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.pages pg JOIN public.projects p ON p.id = pg.project_id WHERE pg.id = page_metadata.page_id AND p.user_id = auth.uid()));

CREATE POLICY page_metadata_update_own ON public.page_metadata FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.pages pg JOIN public.projects p ON p.id = pg.project_id WHERE pg.id = page_metadata.page_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.pages pg JOIN public.projects p ON p.id = pg.project_id WHERE pg.id = page_metadata.page_id AND p.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 5. ROBOTS FILES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.robots_files (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL,
    raw_content TEXT NULL,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_robots_files PRIMARY KEY (id),
    CONSTRAINT fk_robots_files_domain FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE,
    CONSTRAINT uq_robots_files_domain UNIQUE (domain_id)
);

CREATE INDEX idx_robots_files_domain_id ON public.robots_files(domain_id);

CREATE TRIGGER trg_robots_files_set_updated_at
    BEFORE UPDATE ON public.robots_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.robots_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY robots_files_select_own ON public.robots_files FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = robots_files.domain_id AND p.user_id = auth.uid()));

CREATE POLICY robots_files_insert_own ON public.robots_files FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = robots_files.domain_id AND p.user_id = auth.uid()));

CREATE POLICY robots_files_update_own ON public.robots_files FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = robots_files.domain_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = robots_files.domain_id AND p.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 6. SITEMAPS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.sitemaps (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL,
    url TEXT NOT NULL,
    url_count INTEGER NULL,
    last_fetched_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_sitemaps PRIMARY KEY (id),
    CONSTRAINT fk_sitemaps_domain FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE,
    CONSTRAINT uq_sitemaps_domain_url UNIQUE (domain_id, url),
    CONSTRAINT chk_sitemaps_url_format CHECK (url ~ '^https?://')
);

CREATE INDEX idx_sitemaps_domain_id ON public.sitemaps(domain_id);

CREATE TRIGGER trg_sitemaps_set_updated_at
    BEFORE UPDATE ON public.sitemaps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY sitemaps_select_own ON public.sitemaps FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = sitemaps.domain_id AND p.user_id = auth.uid()));

CREATE POLICY sitemaps_insert_own ON public.sitemaps FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = sitemaps.domain_id AND p.user_id = auth.uid()));

CREATE POLICY sitemaps_update_own ON public.sitemaps FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = sitemaps.domain_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = sitemaps.domain_id AND p.user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. CRAWL ERRORS TABLE (Append-Only Log)
-- -----------------------------------------------------------------------------

CREATE TABLE public.crawl_errors (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    crawl_session_id UUID NOT NULL,
    page_id UUID NULL,
    url TEXT NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NULL,
    http_status_code INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_crawl_errors PRIMARY KEY (id),
    CONSTRAINT fk_crawl_errors_session FOREIGN KEY (crawl_session_id) REFERENCES public.crawl_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_crawl_errors_page FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE SET NULL
);

CREATE INDEX idx_crawl_errors_session_id ON public.crawl_errors(crawl_session_id);

-- Note: crawl_errors gets no updated_at trigger; append-only audit log.

ALTER TABLE public.crawl_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawl_errors_select_own ON public.crawl_errors FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.crawl_sessions cs JOIN public.projects p ON p.id = cs.project_id WHERE cs.id = crawl_errors.crawl_session_id AND p.user_id = auth.uid()));

CREATE POLICY crawl_errors_insert_own ON public.crawl_errors FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.crawl_sessions cs JOIN public.projects p ON p.id = cs.project_id WHERE cs.id = crawl_errors.crawl_session_id AND p.user_id = auth.uid()));

CREATE POLICY crawl_errors_update_own ON public.crawl_errors FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.crawl_sessions cs JOIN public.projects p ON p.id = cs.project_id WHERE cs.id = crawl_errors.crawl_session_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.crawl_sessions cs JOIN public.projects p ON p.id = cs.project_id WHERE cs.id = crawl_errors.crawl_session_id AND p.user_id = auth.uid()));
