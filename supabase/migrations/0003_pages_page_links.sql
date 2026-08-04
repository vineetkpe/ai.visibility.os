-- Migration: 0003_pages_page_links.sql
-- Description: Create pages, page_links, and jobs tables with extended metadata columns and RLS policies.

-- Table: public.pages
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(512) NULL,
  http_status INTEGER NULL,
  meta_description TEXT NULL,
  canonical_url TEXT NULL,
  language VARCHAR(10) NULL,
  favicon_url TEXT NULL,
  logo_url TEXT NULL,
  headings JSONB NULL,
  open_graph JSONB NULL,
  twitter_card JSONB NULL,
  json_ld JSONB NULL,
  schema_org_types TEXT[] NULL,
  social_links JSONB NULL,
  organization_details JSONB NULL,
  images JSONB NULL,
  robots_meta VARCHAR(255) NULL,
  word_count INTEGER NULL,
  crawl_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  crawl_error TEXT NULL,
  last_scanned_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.pages
CREATE INDEX IF NOT EXISTS idx_pages_domain_id ON public.pages(domain_id);
CREATE INDEX IF NOT EXISTS idx_pages_url ON public.pages(url);
CREATE INDEX IF NOT EXISTS idx_pages_crawl_status ON public.pages(crawl_status);

-- Enable RLS for public.pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.pages (scoped via domain_id -> domains -> projects.user_id = auth.uid())
CREATE POLICY "Users can manage pages for their projects"
  ON public.pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.domains
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.domains.id = public.pages.domain_id
        AND public.projects.user_id = auth.uid()
        AND public.domains.deleted_at IS NULL
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.domains
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.domains.id = public.pages.domain_id
        AND public.projects.user_id = auth.uid()
        AND public.domains.deleted_at IS NULL
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.page_links
CREATE TABLE IF NOT EXISTS public.page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  link_type VARCHAR(10) NOT NULL CHECK (link_type IN ('internal', 'external')),
  anchor_text TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.page_links
CREATE INDEX IF NOT EXISTS idx_page_links_source_page_id ON public.page_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_link_type ON public.page_links(link_type);

-- Enable RLS for public.page_links
ALTER TABLE public.page_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.page_links (scoped via source_page_id -> pages -> domains -> projects.user_id = auth.uid())
CREATE POLICY "Users can manage page links for their projects"
  ON public.page_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      JOIN public.domains ON public.pages.domain_id = public.domains.id
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.pages.id = public.page_links.source_page_id
        AND public.projects.user_id = auth.uid()
        AND public.domains.deleted_at IS NULL
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages
      JOIN public.domains ON public.pages.domain_id = public.domains.id
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.pages.id = public.page_links.source_page_id
        AND public.projects.user_id = auth.uid()
        AND public.domains.deleted_at IS NULL
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payload JSONB NULL,
  result JSONB NULL,
  error_message TEXT NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.jobs
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Enable RLS for public.jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.jobs
CREATE POLICY "Users can manage jobs for their projects"
  ON public.jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.jobs.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.jobs.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );
