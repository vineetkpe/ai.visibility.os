-- Migration: 0012_data_api_grants.sql
-- Description: Explicit Data API grants for schema public, tables (0002-0010), and RPC functions (0011).
-- Idempotent: Safe to execute on fresh schema following 0011_create_project_with_domain_fn.sql.

-- -----------------------------------------------------------------------------
-- 1. SCHEMA USAGE GRANT
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;

-- Note: anon is intentionally NOT granted schema usage — every table requires auth.uid(),
-- so anon grants would be dead surface area.

-- -----------------------------------------------------------------------------
-- 2. TABLE PRIVILEGES FOR authenticated ROLE
-- -----------------------------------------------------------------------------

-- 0002_users_profile.sql
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 0003_projects_domains.sql
GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.domains TO authenticated;

-- 0004_website_discovery.sql
GRANT SELECT, INSERT, UPDATE ON public.crawl_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.page_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.robots_files TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sitemaps TO authenticated;
GRANT SELECT, INSERT ON public.crawl_errors TO authenticated;

-- 0007_business_context.sql
GRANT SELECT, INSERT ON public.business_context_versions TO authenticated;
GRANT SELECT, INSERT ON public.entities TO authenticated;
GRANT SELECT, INSERT ON public.topics TO authenticated;
GRANT SELECT, INSERT ON public.products TO authenticated;
GRANT SELECT, INSERT ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.technologies TO authenticated;

-- 0008_ai_visibility_engine.sql
GRANT SELECT ON public.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prompt_library TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_scans TO authenticated;
GRANT SELECT, INSERT ON public.citations TO authenticated;

-- 0009_competitors_recommendations.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.recommendations TO authenticated;
GRANT SELECT, INSERT ON public.recommendation_evidence TO authenticated;

-- 0010_jobs_audit_reports.sql
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. FUNCTION EXECUTE GRANTS
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_project_with_domain(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. POSTGREST SCHEMA CACHE RELOAD
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
