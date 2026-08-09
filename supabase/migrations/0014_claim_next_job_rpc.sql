-- Migration: 0014_claim_next_job_rpc.sql
-- Description: Creates atomic claim_next_job RPC function for internal job worker using FOR UPDATE SKIP LOCKED.
-- Idempotent & Data API Grant Compliant.

CREATE OR REPLACE FUNCTION public.claim_next_job(
    p_job_type VARCHAR(50) DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Atomically find and lock the next queued job using FOR UPDATE SKIP LOCKED
    SELECT id INTO v_job_id
    FROM public.jobs
    WHERE status = 'queued'::public.crawl_status
      AND (p_job_type IS NULL OR job_type = p_job_type)
      AND (p_project_id IS NULL OR project_id = p_project_id)
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Atomically transition status from queued to running and set started_at / updated_at
    RETURN QUERY
    UPDATE public.jobs
    SET status = 'running'::public.crawl_status,
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = v_job_id
    RETURNING *;
END;
$$;

-- Grant execution access matching RLS / service role policies
GRANT EXECUTE ON FUNCTION public.claim_next_job(VARCHAR(50), UUID) TO authenticated, service_role;
