-- Security and performance hardening applied to production.
REVOKE EXECUTE ON FUNCTION public.claim_next_job(character varying, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_platform_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_platform_snapshot() TO authenticated;
ALTER FUNCTION public.admin_platform_snapshot() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.route_scan_to_default_provider() SET search_path = pg_catalog, public;

REVOKE ALL ON TABLE public.provider_secrets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.worker_rate_limits FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS provider_secrets_deny_api ON public.provider_secrets;
CREATE POLICY provider_secrets_deny_api ON public.provider_secrets AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS worker_rate_limits_deny_api ON public.worker_rate_limits;
CREATE POLICY worker_rate_limits_deny_api ON public.worker_rate_limits AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);

-- pg_net is not relocatable; leave its extension placement unchanged.

DO $$
DECLARE
  p record;
  q text;
  w text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%auth.%' OR with_check LIKE '%auth.%')
  LOOP
    q := CASE WHEN p.qual IS NULL THEN NULL ELSE replace(p.qual, 'auth.uid()', '(select auth.uid())') END;
    w := CASE WHEN p.with_check IS NULL THEN NULL ELSE replace(p.with_check, 'auth.uid()', '(select auth.uid())') END;
    IF q IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING %s', p.policyname, p.tablename, q);
    END IF;
    IF w IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK %s', p.policyname, p.tablename, w);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_pages_domain_project ON public.pages (domain_id, project_id);
CREATE INDEX IF NOT EXISTS idx_crawl_errors_page_id ON public.crawl_errors (page_id);
CREATE INDEX IF NOT EXISTS idx_entities_source_page_id ON public.entities (source_page_id);
CREATE INDEX IF NOT EXISTS idx_topics_source_page_id ON public.topics (source_page_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_scan_id ON public.recommendation_evidence (ai_scan_id);
CREATE INDEX IF NOT EXISTS idx_products_source_page_id ON public.products (source_page_id);
CREATE INDEX IF NOT EXISTS idx_services_source_page_id ON public.services (source_page_id);
CREATE INDEX IF NOT EXISTS idx_technologies_source_page_id ON public.technologies (source_page_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_prompt_library_id ON public.ai_scans (prompt_library_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_citation_id ON public.recommendation_evidence (citation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_competitor_id ON public.recommendation_evidence (competitor_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_evidence_page_id ON public.recommendation_evidence (page_id);

NOTIFY pgrst, 'reload schema';
