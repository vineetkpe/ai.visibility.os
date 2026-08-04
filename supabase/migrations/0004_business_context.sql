-- Migration: 0004_business_context.sql
-- Description: Create business_context_versions and business_context_fields tables with RLS policies and partial unique index.

-- Table: public.business_context_versions
CREATE TABLE IF NOT EXISTS public.business_context_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generation_method VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.business_context_versions
CREATE INDEX IF NOT EXISTS idx_business_context_versions_project_id ON public.business_context_versions(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_context_versions_current ON public.business_context_versions(project_id) WHERE is_current = true;

-- Enable RLS for public.business_context_versions
ALTER TABLE public.business_context_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.business_context_versions
CREATE POLICY "Users can manage business context versions for their projects"
  ON public.business_context_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.business_context_versions.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.business_context_versions.project_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );

-- Table: public.business_context_fields
CREATE TABLE IF NOT EXISTS public.business_context_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_version_id UUID NOT NULL REFERENCES public.business_context_versions(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  field_value TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_page_id UUID NULL REFERENCES public.pages(id) ON DELETE SET NULL,
  extraction_method VARCHAR(20) NOT NULL CHECK (extraction_method IN ('deterministic', 'ai_inferred')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.business_context_fields
CREATE INDEX IF NOT EXISTS idx_business_context_fields_version_id ON public.business_context_fields(context_version_id);
CREATE INDEX IF NOT EXISTS idx_business_context_fields_name ON public.business_context_fields(field_name);

-- Enable RLS for public.business_context_fields
ALTER TABLE public.business_context_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.business_context_fields
CREATE POLICY "Users can manage business context fields for their projects"
  ON public.business_context_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_context_versions
      JOIN public.projects ON public.business_context_versions.project_id = public.projects.id
      WHERE public.business_context_versions.id = public.business_context_fields.context_version_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_context_versions
      JOIN public.projects ON public.business_context_versions.project_id = public.projects.id
      WHERE public.business_context_versions.id = public.business_context_fields.context_version_id
        AND public.projects.user_id = auth.uid()
        AND public.projects.deleted_at IS NULL
    )
  );
