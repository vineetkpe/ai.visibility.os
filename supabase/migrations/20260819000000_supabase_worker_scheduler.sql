-- Supabase-owned scheduler for background jobs.
-- Keeps Vercel Hobby free: pg_cron invokes the existing authenticated worker endpoint.
-- IMPORTANT: worker_secret is intentionally NOT stored in migrations. Set it once in
-- production after applying this migration and keep the same value in Vercel's
-- JOB_WORKER_SECRET (or CRON_SECRET) environment variable.

CREATE SCHEMA IF NOT EXISTS internal_worker;

CREATE TABLE IF NOT EXISTS internal_worker.config (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
    worker_secret TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA internal_worker FROM PUBLIC, anon, authenticated;
REVOKE ALL ON internal_worker.config FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION internal_worker.invoke_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, internal_worker, net
AS $$
DECLARE
    secret TEXT;
BEGIN
    SELECT worker_secret
      INTO secret
      FROM internal_worker.config
     WHERE id = TRUE;

    IF secret IS NULL OR btrim(secret) = '' THEN
        RAISE EXCEPTION 'internal_worker.config.worker_secret is not configured';
    END IF;

    PERFORM net.http_post(
        url := 'https://ai-visibility-os-web.vercel.app/api/jobs/worker',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || secret,
            'Content-Type', 'application/json',
            'x-supabase-worker', '1'
        ),
        body := '{"source":"supabase-cron"}'::jsonb,
        timeout_milliseconds := 5000
    );
END;
$$;

REVOKE ALL ON FUNCTION internal_worker.invoke_worker() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal_worker.invoke_worker() TO postgres;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM cron.job
         WHERE command = 'select internal_worker.invoke_worker();'
    ) THEN
        PERFORM cron.schedule(
            'ai-visibility-worker',
            '* * * * *',
            'select internal_worker.invoke_worker();'
        );
    END IF;
END;
$$;
