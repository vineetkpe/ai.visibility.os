-- Migration: 0007_recommendations_engine.sql
-- Description: Extend recommendations table, create recommendation_evidence and recommendation_history tables with RLS matching DATABASE_SCHEMA.md section 4.11 and Prompt 12 specifications.

-- 1. Create or Extend public.recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scan_id UUID NULL REFERENCES public.scans(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all new columns exist on public.recommendations
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS estimated_impact VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS estimated_effort VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) NULL,
  ADD COLUMN IF NOT EXISTS implementation_steps JSONB NULL,
  ADD COLUMN IF NOT EXISTS generation_method VARCHAR(20) NOT NULL DEFAULT 'deterministic';

-- Add/Update CHECK constraints on recommendations
DO $$
BEGIN
  -- Category constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_category') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_category;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_category
    CHECK (category IN (
      'content', 'technical_seo', 'schema', 'entity_optimization',
      'citation_opportunity', 'internal_linking', 'metadata', 'ai_visibility'
    ));

  -- Priority constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_priority') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_priority;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_priority
    CHECK (priority IN ('critical', 'high', 'medium', 'low'));

  -- Impact constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_estimated_impact') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_estimated_impact;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_estimated_impact
    CHECK (estimated_impact IS NULL OR estimated_impact IN ('high', 'medium', 'low'));

  -- Effort constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_estimated_effort') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_estimated_effort;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_estimated_effort
    CHECK (estimated_effort IS NULL OR estimated_effort IN ('quick_win', 'moderate', 'significant'));

  -- Generation method constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_generation_method') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_generation_method;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_generation_method
    CHECK (generation_method IN ('deterministic', 'ai_phrased'));

  -- Status constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_status') THEN
    ALTER TABLE public.recommendations DROP CONSTRAINT chk_recommendations_status;
  END IF;
  ALTER TABLE public.recommendations ADD CONSTRAINT chk_recommendations_status
    CHECK (status IN ('open', 'in_progress', 'completed', 'dismissed'));
END $$;

-- Indexes for public.recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_project_id ON public.recommendations(project_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON public.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON public.recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON public.recommendations(priority);

-- Enable RLS for public.recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage recommendations for their projects') THEN
    CREATE POLICY "Users can manage recommendations for their projects"
      ON public.recommendations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE public.projects.id = public.recommendations.project_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE public.projects.id = public.recommendations.project_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- 2. Create public.recommendation_evidence table
CREATE TABLE IF NOT EXISTS public.recommendation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  page_id UUID NULL REFERENCES public.pages(id) ON DELETE SET NULL,
  scan_id UUID NULL REFERENCES public.scans(id) ON DELETE SET NULL,
  citation_id UUID NULL REFERENCES public.citations(id) ON DELETE SET NULL,
  competitor_scan_id UUID NULL REFERENCES public.competitor_scans(id) ON DELETE SET NULL,
  evidence_description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_recommendation_evidence_source CHECK (
    page_id IS NOT NULL OR scan_id IS NOT NULL OR citation_id IS NOT NULL OR competitor_scan_id IS NOT NULL
  )
);

-- Indexes for public.recommendation_evidence
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_rec_id ON public.recommendation_evidence(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_page_id ON public.recommendation_evidence(page_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_scan_id ON public.recommendation_evidence(scan_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_citation_id ON public.recommendation_evidence(citation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_comp_scan_id ON public.recommendation_evidence(competitor_scan_id);

-- Enable RLS for public.recommendation_evidence
ALTER TABLE public.recommendation_evidence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage recommendation evidence for their projects') THEN
    CREATE POLICY "Users can manage recommendation evidence for their projects"
      ON public.recommendation_evidence
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.recommendations
          JOIN public.projects ON public.recommendations.project_id = public.projects.id
          WHERE public.recommendations.id = public.recommendation_evidence.recommendation_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.recommendations
          JOIN public.projects ON public.recommendations.project_id = public.projects.id
          WHERE public.recommendations.id = public.recommendation_evidence.recommendation_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- 3. Create public.recommendation_history table
CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for public.recommendation_history
CREATE INDEX IF NOT EXISTS idx_recommendation_history_rec_id ON public.recommendation_history(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_evaluated_at ON public.recommendation_history(evaluated_at DESC);

-- Enable RLS for public.recommendation_history
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage recommendation history for their projects') THEN
    CREATE POLICY "Users can manage recommendation history for their projects"
      ON public.recommendation_history
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.recommendations
          JOIN public.projects ON public.recommendations.project_id = public.projects.id
          WHERE public.recommendations.id = public.recommendation_history.recommendation_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.recommendations
          JOIN public.projects ON public.recommendations.project_id = public.projects.id
          WHERE public.recommendations.id = public.recommendation_history.recommendation_id
            AND public.projects.user_id = auth.uid()
            AND public.projects.deleted_at IS NULL
        )
      );
  END IF;
END $$;
