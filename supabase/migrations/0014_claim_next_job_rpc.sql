-- Migration: 0014_claim_next_job_rpc.sql
-- Description: Creates atomic claim_next_job RPC function for internal job worker using FOR UPDATE SKIP LOCKED.
-- Hardened security: Enforces explicit search_path, project ownership scoping for authenticated users, and minimal grants.

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
    SELECT j.id INTO v_job_id
    FROM public.jobs j
    WHERE j.status = 'queued'::public.crawl_status
      AND (p_job_type IS NULL OR j.job_type = p_job_type)
      AND (p_project_id IS NULL OR j.project_id = p_project_id)
      -- Security scoping: service_role or owner of project
      AND (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = j.project_id AND p.user_id = auth.uid()
        )
      )
    ORDER BY j.created_at ASC
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

-- Minimal, secure function grants
REVOKE EXECUTE ON FUNCTION public.claim_next_job(VARCHAR(50), UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_next_job(VARCHAR(50), UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_next_job(VARCHAR(50), UUID) TO authenticated, service_role;
