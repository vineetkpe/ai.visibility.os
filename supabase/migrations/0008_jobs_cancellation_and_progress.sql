-- Migration: 0008_jobs_cancellation_and_progress.sql
-- Description: Add trigger_run_id and progress columns to public.jobs table.

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trigger_run_id TEXT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS progress JSONB NULL;
