-- Migration: 0002_projects_domains.sql
-- Description: Create projects and domains tables with RLS policies and soft delete support matching DATABASE_SCHEMA.md sections 4.3 and 4.4.

-- Table: public.projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  target_keywords TEXT[] NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- Indexes for public.projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);

-- Enable RLS for public.projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.projects
CREATE POLICY "Users can manage their own projects"
  ON public.projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: public.domains
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  domain_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- Indexes for public.domains
CREATE INDEX IF NOT EXISTS idx_domains_project_id ON public.domains(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON public.domains(domain_name);

-- Enable RLS for public.domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.domains
CREATE POLICY "Users can manage domains for their projects"
  ON public.domains
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.domains.project_id
        AND public.projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.domains.project_id
        AND public.projects.user_id = auth.uid()
    )
  );
