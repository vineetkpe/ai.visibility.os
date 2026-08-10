-- Migration: 0016_worker_rate_limiter.sql
-- Description: Distributed rate limiting table and atomic RPC function for worker endpoint across multi-instance serverless deployments.

CREATE TABLE IF NOT EXISTS public.worker_rate_limits (
    rate_key VARCHAR(128) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_worker_rate_limits PRIMARY KEY (rate_key)
);

ALTER TABLE public.worker_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_worker_rate_limits_window ON public.worker_rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.check_worker_rate_limit(
    p_rate_key VARCHAR(128),
    p_max_requests INTEGER,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, reset_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_window_start TIMESTAMPTZ;
    v_count INTEGER;
    v_allowed BOOLEAN;
    v_reset INTEGER;
BEGIN
    IF random() < 0.05 THEN
        DELETE FROM public.worker_rate_limits
        WHERE window_start < v_now - INTERVAL '10 minutes';
    END IF;

    INSERT INTO public.worker_rate_limits (rate_key, request_count, window_start, updated_at)
    VALUES (p_rate_key, 1, v_now, v_now)
    ON CONFLICT (rate_key) DO UPDATE
    SET request_count = CASE WHEN public.worker_rate_limits.window_start < v_now - (p_window_seconds || ' seconds')::INTERVAL THEN 1 ELSE public.worker_rate_limits.request_count + 1 END,
        window_start = CASE WHEN public.worker_rate_limits.window_start < v_now - (p_window_seconds || ' seconds')::INTERVAL THEN v_now ELSE public.worker_rate_limits.window_start END,
        updated_at = v_now
    RETURNING worker_rate_limits.request_count, worker_rate_limits.window_start INTO v_count, v_window_start;

    v_allowed := (v_count <= p_max_requests);
    v_reset := GREATEST(0, EXTRACT(EPOCH FROM (v_window_start + (p_window_seconds || ' seconds')::INTERVAL - v_now))::INTEGER);
    RETURN QUERY SELECT v_allowed, v_count, v_reset;
END;
$$;

-- No direct table access. Only the server-side service role may invoke the RPC.
REVOKE ALL ON TABLE public.worker_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_rate_limits TO service_role;
REVOKE EXECUTE ON FUNCTION public.check_worker_rate_limit(VARCHAR(128), INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_worker_rate_limit(VARCHAR(128), INTEGER, INTEGER) TO service_role;
