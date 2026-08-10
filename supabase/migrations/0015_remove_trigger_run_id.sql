-- Migration: 0015_remove_trigger_run_id.sql
-- Description: Safely drop legacy trigger_run_id column from public.jobs table.

ALTER TABLE public.jobs DROP COLUMN IF EXISTS trigger_run_id;
