-- Migration: 0005_scans_citations_prompts.sql
-- Description: Create prompt_library, scans, page_scans, citations, entities, and entity_mentions tables with RLS policies.

-- Table: public.prompt_library
CREATE TABLE IF NOT EXISTS public.prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  intent VARCHAR(50) NOT NULL,
  source_fields TEXT[] NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_prompt_library_project_prompt UNIQUE (project_id, prompt_text)
);

-- Indexes for public.prompt_library
CREATE INDEX IF NOT EXISTS idx_prompt_library_project_id ON public.prompt_library(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_library_intent ON public.prompt_library(intent);

-- Enable RLS for public.prompt_library
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage prompt library for their projects"
  ON public.prompt_library
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.prompt_library.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.prompt_library.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.scans
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_id UUID NULL REFERENCES public.prompt_library(id) ON DELETE SET NULL,
  query_prompt TEXT NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  visibility_score NUMERIC(5,2) NULL,
  summary TEXT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- Indexes for public.scans
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON public.scans(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);

-- Enable RLS for public.scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage scans for their projects"
  ON public.scans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.scans.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.scans.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.page_scans
CREATE TABLE IF NOT EXISTS public.page_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(3,2) NULL,
  rank_position INTEGER NULL,
  snippet_extracted TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.page_scans
CREATE INDEX IF NOT EXISTS idx_page_scans_scan_id ON public.page_scans(scan_id);
CREATE INDEX IF NOT EXISTS idx_page_scans_page_id ON public.page_scans(page_id);

-- Enable RLS for public.page_scans
ALTER TABLE public.page_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage page scans for their projects"
  ON public.page_scans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.page_scans.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.page_scans.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.citations
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_domain VARCHAR(255) NOT NULL,
  anchor_text TEXT NULL,
  citation_order INTEGER NULL,
  is_own_domain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.citations
CREATE INDEX IF NOT EXISTS idx_citations_scan_id ON public.citations(scan_id);
CREATE INDEX IF NOT EXISTS idx_citations_source_domain ON public.citations(source_domain);

-- Enable RLS for public.citations
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage citations for their projects"
  ON public.citations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.citations.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.citations.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.entities
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.entities
CREATE INDEX IF NOT EXISTS idx_entities_name ON public.entities(name);

-- Enable RLS for public.entities (Read-only catalog for authenticated users)
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read entities"
  ON public.entities
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert entities"
  ON public.entities
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Table: public.entity_mentions
CREATE TABLE IF NOT EXISTS public.entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  scan_id UUID NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  context_snippet TEXT NULL,
  sentiment VARCHAR(20) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_entity_mentions_source CHECK (scan_id IS NOT NULL OR page_id IS NOT NULL)
);

-- Indexes for public.entity_mentions
CREATE INDEX IF NOT EXISTS idx_entity_mentions_scan_id ON public.entity_mentions(scan_id);
CREATE INDEX IF NOT EXISTS idx_entity_mentions_entity_id ON public.entity_mentions(entity_id);

-- Enable RLS for public.entity_mentions
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage entity mentions for their projects"
  ON public.entity_mentions
  FOR ALL
  USING (
    (scan_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.entity_mentions.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )) OR
    (page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pages
      JOIN public.domains ON public.pages.domain_id = public.domains.id
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.pages.id = public.entity_mentions.page_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    ))
  )
  WITH CHECK (
    (scan_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.scans
      JOIN public.projects ON public.scans.project_id = public.projects.id
      WHERE public.scans.id = public.entity_mentions.scan_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )) OR
    (page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pages
      JOIN public.domains ON public.pages.domain_id = public.domains.id
      JOIN public.projects ON public.domains.project_id = public.projects.id
      WHERE public.pages.id = public.entity_mentions.page_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    ))
  );
