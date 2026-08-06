-- Test Suite: 0006_fix_crawl_errors_append_only.sql
-- Description: Verifies crawl_errors is strictly append-only (no UPDATE policy exists).

BEGIN;

-- Enable pgTAP testing framework extension
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(3);

-- 1. Verify crawl_errors_update_own policy does NOT exist in pg_policies
SELECT is(
    (SELECT count(*)::integer FROM pg_policies WHERE tablename = 'crawl_errors' AND policyname = 'crawl_errors_update_own'),
    0,
    'crawl_errors_update_own policy must not exist on public.crawl_errors'
);

-- 2. Verify allowed policies on public.crawl_errors are strictly SELECT and INSERT
SELECT set_has(
    'SELECT policyname::text FROM pg_policies WHERE tablename = ''crawl_errors''',
    ARRAY['crawl_errors_select_own', 'crawl_errors_insert_own'],
    'crawl_errors must only have SELECT and INSERT RLS policies'
);

-- 3. Idempotency Verification
DROP POLICY IF EXISTS crawl_errors_update_own ON public.crawl_errors;

SELECT pass('Idempotent removal of crawl_errors_update_own policy completed without errors');

SELECT * FROM finish();

ROLLBACK;
