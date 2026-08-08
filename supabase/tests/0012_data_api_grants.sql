-- Test Suite: 0012_data_api_grants.sql
-- Description: Tests explicit Data API grants on schema public, 25 foundation tables, RPC function, and zero privileges for anon.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(52);

-- 1. Schema Usage Verification
SELECT has_schema_privilege(
    'authenticated',
    'public',
    'usage',
    'authenticated role must have USAGE on schema public'
);

-- 2. RPC Function Execute Verification
SELECT has_function_privilege(
    'authenticated',
    'public.create_project_with_domain(text, text)',
    'execute',
    'authenticated role must have EXECUTE on create_project_with_domain'
);

-- Helper function to fetch granted privilege types as text array
CREATE OR REPLACE FUNCTION _get_granted_privileges(p_grantee text, p_table text)
RETURNS text[] LANGUAGE sql AS $$
    SELECT COALESCE(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
    FROM information_schema.table_privileges
    WHERE grantee = p_grantee AND table_schema = 'public' AND table_name = p_table;
$$;

-- 3. Authenticated Table Privilege Tests (25 tables)
SELECT is(_get_granted_privileges('authenticated', 'users'), ARRAY['SELECT', 'UPDATE'], 'users table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'projects'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'projects table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'domains'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'domains table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'crawl_sessions'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'crawl_sessions table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'pages'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'pages table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'page_metadata'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'page_metadata table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'robots_files'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'robots_files table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'sitemaps'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'sitemaps table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'crawl_errors'), ARRAY['INSERT', 'SELECT'], 'crawl_errors table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'business_context_versions'), ARRAY['INSERT', 'SELECT'], 'business_context_versions table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'entities'), ARRAY['INSERT', 'SELECT'], 'entities table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'topics'), ARRAY['INSERT', 'SELECT'], 'topics table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'products'), ARRAY['INSERT', 'SELECT'], 'products table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'services'), ARRAY['INSERT', 'SELECT'], 'services table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'technologies'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'technologies table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'providers'), ARRAY['SELECT'], 'providers table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'prompt_library'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'prompt_library table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'ai_scans'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'ai_scans table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'citations'), ARRAY['INSERT', 'SELECT'], 'citations table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'competitors'), ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE'], 'competitors table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'recommendations'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'recommendations table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'recommendation_evidence'), ARRAY['INSERT', 'SELECT'], 'recommendation_evidence table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'jobs'), ARRAY['INSERT', 'SELECT', 'UPDATE'], 'jobs table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'audit_logs'), ARRAY['INSERT', 'SELECT'], 'audit_logs table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'reports'), ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE'], 'reports table privileges for authenticated');

-- 4. Anon Zero-Privilege Tests (25 tables)
SELECT is(_get_granted_privileges('anon', 'users'), ARRAY[]::text[], 'anon has zero privileges on users');
SELECT is(_get_granted_privileges('anon', 'projects'), ARRAY[]::text[], 'anon has zero privileges on projects');
SELECT is(_get_granted_privileges('anon', 'domains'), ARRAY[]::text[], 'anon has zero privileges on domains');
SELECT is(_get_granted_privileges('anon', 'crawl_sessions'), ARRAY[]::text[], 'anon has zero privileges on crawl_sessions');
SELECT is(_get_granted_privileges('anon', 'pages'), ARRAY[]::text[], 'anon has zero privileges on pages');
SELECT is(_get_granted_privileges('anon', 'page_metadata'), ARRAY[]::text[], 'anon has zero privileges on page_metadata');
SELECT is(_get_granted_privileges('anon', 'robots_files'), ARRAY[]::text[], 'anon has zero privileges on robots_files');
SELECT is(_get_granted_privileges('anon', 'sitemaps'), ARRAY[]::text[], 'anon has zero privileges on sitemaps');
SELECT is(_get_granted_privileges('anon', 'crawl_errors'), ARRAY[]::text[], 'anon has zero privileges on crawl_errors');
SELECT is(_get_granted_privileges('anon', 'business_context_versions'), ARRAY[]::text[], 'anon has zero privileges on business_context_versions');
SELECT is(_get_granted_privileges('anon', 'entities'), ARRAY[]::text[], 'anon has zero privileges on entities');
SELECT is(_get_granted_privileges('anon', 'topics'), ARRAY[]::text[], 'anon has zero privileges on topics');
SELECT is(_get_granted_privileges('anon', 'products'), ARRAY[]::text[], 'anon has zero privileges on products');
SELECT is(_get_granted_privileges('anon', 'services'), ARRAY[]::text[], 'anon has zero privileges on services');
SELECT is(_get_granted_privileges('anon', 'technologies'), ARRAY[]::text[], 'anon has zero privileges on technologies');
SELECT is(_get_granted_privileges('anon', 'providers'), ARRAY[]::text[], 'anon has zero privileges on providers');
SELECT is(_get_granted_privileges('anon', 'prompt_library'), ARRAY[]::text[], 'anon has zero privileges on prompt_library');
SELECT is(_get_granted_privileges('anon', 'ai_scans'), ARRAY[]::text[], 'anon has zero privileges on ai_scans');
SELECT is(_get_granted_privileges('anon', 'citations'), ARRAY[]::text[], 'anon has zero privileges on citations');
SELECT is(_get_granted_privileges('anon', 'competitors'), ARRAY[]::text[], 'anon has zero privileges on competitors');
SELECT is(_get_granted_privileges('anon', 'recommendations'), ARRAY[]::text[], 'anon has zero privileges on recommendations');
SELECT is(_get_granted_privileges('anon', 'recommendation_evidence'), ARRAY[]::text[], 'anon has zero privileges on recommendation_evidence');
SELECT is(_get_granted_privileges('anon', 'jobs'), ARRAY[]::text[], 'anon has zero privileges on jobs');
SELECT is(_get_granted_privileges('anon', 'audit_logs'), ARRAY[]::text[], 'anon has zero privileges on audit_logs');
SELECT is(_get_granted_privileges('anon', 'reports'), ARRAY[]::text[], 'anon has zero privileges on reports');

SELECT * FROM finish();

ROLLBACK;
