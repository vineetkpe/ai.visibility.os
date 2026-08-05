-- Migration: 0009_realtime_publication.sql
-- Description: Enable Supabase Realtime publication for public.scans and public.jobs tables and set REPLICA IDENTITY FULL for filtered postgres_changes subscriptions.

-- 1. Set REPLICA IDENTITY FULL for scans and jobs tables to support row filtering & old data diffing
ALTER TABLE public.scans REPLICA IDENTITY FULL;
ALTER TABLE public.jobs REPLICA IDENTITY FULL;

-- 2. Add public.scans and public.jobs to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add public.scans if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'scans'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
    END IF;

    -- Add public.jobs if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'jobs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
    END IF;
  END IF;
END $$;
