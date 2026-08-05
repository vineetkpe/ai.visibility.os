-- Migration: 0008_recommendations_scope_key.sql
-- Description: Add scope_key column to public.recommendations with partial unique index on (project_id, scope_key) for open/in_progress recommendations.

-- 1. Add scope_key column
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS scope_key VARCHAR(255) NULL;

-- Populate scope_key for any legacy rows missing it
UPDATE public.recommendations
SET scope_key = category || ':' || id
WHERE scope_key IS NULL;

-- Set NOT NULL constraint
ALTER TABLE public.recommendations
  ALTER COLUMN scope_key SET NOT NULL;

-- 2. Partial Unique Index on (project_id, scope_key) for active recommendations
CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendations_project_scope_key_open
  ON public.recommendations(project_id, scope_key)
  WHERE status IN ('open', 'in_progress');
