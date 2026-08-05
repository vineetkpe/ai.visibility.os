-- Migration: 0006_competitors_intelligence.sql
-- Description: Migrate competitors and competitor_scans tables with domain_type on domains and competitor_id on citations matching DATABASE_SCHEMA.md sections 4.8 and 4.9.

-- Add domain_type to public.domains
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS domain_type VARCHAR(20) NOT NULL DEFAULT 'own' CHECK (domain_type IN ('own', 'competitor'));

-- Table: public.competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255) NOT NULL,
  domain_id UUID NULL REFERENCES public.domains(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.competitors
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON public.competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_competitors_domain_id ON public.competitors(domain_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_type ON public.domains(domain_type);

-- Enable RLS for public.competitors
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage competitors for their projects"
  ON public.competitors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.competitors.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.competitors.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.competitor_scans
CREATE TABLE IF NOT EXISTS public.competitor_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  visibility_score NUMERIC(5,2) NULL,
  mention_count INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.competitor_scans
CREATE INDEX IF NOT EXISTS idx_competitor_scans_competitor_id ON public.competitor_scans(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_scans_scan_id ON public.competitor_scans(scan_id);

-- Enable RLS for public.competitor_scans
ALTER TABLE public.competitor_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage competitor scans for their projects"
  ON public.competitor_scans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.competitors
      JOIN public.projects ON public.competitors.project_id = public.projects.id
      WHERE public.competitors.id = public.competitor_scans.competitor_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitors
      JOIN public.projects ON public.competitors.project_id = public.projects.id
      WHERE public.competitors.id = public.competitor_scans.competitor_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Add competitor_id to public.citations
ALTER TABLE public.citations
  ADD COLUMN IF NOT EXISTS competitor_id UUID NULL REFERENCES public.competitors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_citations_competitor_id ON public.citations(competitor_id);
