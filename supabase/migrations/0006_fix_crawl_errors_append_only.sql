-- Migration: 0006_fix_crawl_errors_append_only.sql
-- Description: Removes UPDATE policy from public.crawl_errors to enforce append-only audit logging.
-- Idempotent: Safe to re-run.

DROP POLICY IF EXISTS crawl_errors_update_own ON public.crawl_errors;
