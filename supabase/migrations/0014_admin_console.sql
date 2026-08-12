-- Migration: 0014_admin_console.sql
-- Purpose: privileged admin analytics + immutable owner/admin deletion protection.

CREATE OR REPLACE FUNCTION public.admin_platform_snapshot()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_role public.user_role; v_scan_rate numeric; v_user_rate numeric;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'owner') THEN RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501'; END IF;
  SELECT COALESCE(AVG(day_count), 0) INTO v_scan_rate FROM (SELECT gs::date AS day, COUNT(s.id)::numeric AS day_count FROM generate_series(current_date - 6, current_date, interval '1 day') gs LEFT JOIN public.ai_scans s ON s.created_at::date = gs::date GROUP BY gs::date) d;
  SELECT COALESCE(AVG(day_count), 0) INTO v_user_rate FROM (SELECT gs::date AS day, COUNT(u.id)::numeric AS day_count FROM generate_series(current_date - 6, current_date, interval '1 day') gs LEFT JOIN public.users u ON u.created_at::date = gs::date GROUP BY gs::date) d;
  RETURN jsonb_build_object(
    'users_total', (SELECT COUNT(*) FROM public.users), 'users_admin', (SELECT COUNT(*) FROM public.users WHERE role = 'admin'), 'users_owner', (SELECT COUNT(*) FROM public.users WHERE role = 'owner'), 'users_onboarded', (SELECT COUNT(*) FROM public.users WHERE is_onboarded), 'users_active_7d', (SELECT COUNT(*) FROM public.users WHERE last_login_at >= now() - interval '7 days'),
    'projects_total', (SELECT COUNT(*) FROM public.projects WHERE deleted_at IS NULL), 'scans_total', (SELECT COUNT(*) FROM public.ai_scans), 'scans_completed', (SELECT COUNT(*) FROM public.ai_scans WHERE status = 'completed'), 'scans_failed', (SELECT COUNT(*) FROM public.ai_scans WHERE status = 'failed'), 'scans_running', (SELECT COUNT(*) FROM public.ai_scans WHERE status = 'running'), 'scans_queued', (SELECT COUNT(*) FROM public.ai_scans WHERE status = 'queued'),
    'jobs_total', (SELECT COUNT(*) FROM public.jobs), 'jobs_completed', (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed'), 'jobs_failed', (SELECT COUNT(*) FROM public.jobs WHERE status = 'failed'), 'jobs_running', (SELECT COUNT(*) FROM public.jobs WHERE status = 'running'), 'jobs_queued', (SELECT COUNT(*) FROM public.jobs WHERE status = 'queued'),
    'pages_total', (SELECT COUNT(*) FROM public.pages), 'audit_logs_total', (SELECT COUNT(*) FROM public.audit_logs), 'providers_active', (SELECT COUNT(*) FROM public.providers WHERE is_active), 'providers_total', (SELECT COUNT(*) FROM public.providers),
    'daily_scans', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', to_char(d.day, 'Mon DD'), 'count', d.count, 'failed', d.failed) ORDER BY d.day) FROM (SELECT gs::date AS day, COUNT(s.id)::int AS count, COUNT(s.id) FILTER (WHERE s.status = 'failed')::int AS failed FROM generate_series(current_date - 13, current_date, interval '1 day') gs LEFT JOIN public.ai_scans s ON s.created_at::date = gs::date GROUP BY gs::date) d), '[]'::jsonb),
    'daily_users', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', to_char(d.day, 'Mon DD'), 'count', d.count) ORDER BY d.day) FROM (SELECT gs::date AS day, COUNT(u.id)::int AS count FROM generate_series(current_date - 13, current_date, interval '1 day') gs LEFT JOIN public.users u ON u.created_at::date = gs::date GROUP BY gs::date) d), '[]'::jsonb),
    'recent_scans', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT id, status::text, model_name, created_at, error_message FROM public.ai_scans ORDER BY created_at DESC LIMIT 12) x), '[]'::jsonb),
    'recent_users', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT u.id, au.email, u.display_name, u.role::text, u.is_onboarded, u.last_login_at, u.created_at FROM public.users u LEFT JOIN auth.users au ON au.id = u.id ORDER BY u.created_at DESC LIMIT 25) x), '[]'::jsonb),
    'recent_activity', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT id, action, resource_type, created_at, actor_user_id FROM public.audit_logs ORDER BY created_at DESC LIMIT 20) x), '[]'::jsonb),
    'forecast', jsonb_build_object('next_30_days_scans', GREATEST(0, round(v_scan_rate * 30))::int, 'next_30_days_new_users', GREATEST(0, round(v_user_rate * 30))::int, 'daily_scan_run_rate', round(v_scan_rate, 2), 'daily_user_run_rate', round(v_user_rate, 2))
  );
END; $$;
REVOKE ALL ON FUNCTION public.admin_platform_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_snapshot() TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_privileged_accounts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role IN ('admin', 'owner') THEN RAISE EXCEPTION 'privileged accounts cannot be deleted; demote only after verified administrative confirmation' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN RAISE EXCEPTION 'owner account cannot be demoted' USING ERRCODE = '42501'; END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS trg_protect_privileged_accounts ON public.users;
CREATE TRIGGER trg_protect_privileged_accounts BEFORE UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_accounts();
REVOKE EXECUTE ON FUNCTION public.protect_privileged_accounts() FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
