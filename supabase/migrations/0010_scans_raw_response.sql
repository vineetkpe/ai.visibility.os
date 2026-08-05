-- Migration: 0010_scans_raw_response.sql
-- Description: Add raw_response column to public.scans to persist verbatim grounded AI model response text.

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS raw_response TEXT NULL;
