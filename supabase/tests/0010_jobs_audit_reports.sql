-- Test Suite: 0010_jobs_audit_reports.sql
-- Description: Tests Jobs, Audit Logs & Reports schema (default column values, retry bounds, audit log immutability & RLS write checks, report scan_id nullability, format enums, version & date range constraints, cross-user isolation, and hard-DELETE permissions).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(19);

-- Setup test users, project, provider, and scan record
DO $$
DECLARE
    gemini_id UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('10101010-1010-1010-1010-101010101010', '00000000-0000-0000-0000-000000000000', 'owner_job@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('20202020-2020-2020-2020-202020202020', '00000000-0000-0000-0000-000000000000', 'other_job@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES 
        ('p10101010-1010-1010-1010-101010101010', '10101010-1010-1010-1010-101010101010', 'Owner Project', 'owner-project'),
        ('p20202020-2020-2020-2020-202020202020', '20202020-2020-2020-2020-202020202020', 'Other Project', 'other-project');

    SELECT id INTO gemini_id FROM public.providers WHERE slug = 'gemini';

    INSERT INTO public.ai_scans (id, project_id, provider_id, prompt_text, status)
    VALUES 
        ('s10101010-1010-1010-1010-101010101010', 'p10101010-1010-1010-1010-101010101010', gemini_id, 'Test Prompt', 'completed');
END $$;

-- Switch context to project owner
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '10101010-1010-1010-1010-101010101010';

-- 1. Jobs Defaults: status='queued', retry_count=0, max_retries=3
DO $$
BEGIN
    INSERT INTO public.jobs (id, project_id, job_type)
    VALUES ('j1111111-1111-1111-1111-111111111111', 'p10101010-1010-1010-1010-101010101010', 'site-crawl');
END $$;

SELECT is(
    (SELECT status::text FROM public.jobs WHERE id = 'j1111111-1111-1111-1111-111111111111'),
    'queued',
    'jobs status defaults to queued'
);

SELECT is(
    (SELECT retry_count FROM public.jobs WHERE id = 'j1111111-1111-1111-1111-111111111111'),
    0,
    'jobs retry_count defaults to 0'
);

SELECT is(
    (SELECT max_retries FROM public.jobs WHERE id = 'j1111111-1111-1111-1111-111111111111'),
    3,
    'jobs max_retries defaults to 3'
);

-- 2. Jobs Constraint: retry_count=5 with max_retries=3 is rejected by chk_jobs_retry_bounds
SELECT throws_ok(
    $$ INSERT INTO public.jobs (project_id, job_type, retry_count, max_retries) VALUES ('p10101010-1010-1010-1010-101010101010', 'site-crawl', 5, 3) $$,
    23514,
    NULL,
    'retry_count greater than max_retries is rejected by chk_jobs_retry_bounds'
);

-- 3. Audit Logs Insertion: project_id=NULL with actor_user_id=auth.uid() succeeds
DO $$
BEGIN
    INSERT INTO public.audit_logs (id, actor_user_id, action)
    VALUES ('a1111111-1111-1111-1111-111111111111', '10101010-1010-1010-1010-101010101010', 'user.login');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.audit_logs WHERE id = 'a1111111-1111-1111-1111-111111111111'),
    1,
    'audit_logs insert with project_id=NULL and actor_user_id=auth.uid() succeeds'
);

-- 4. Audit Logs RLS Write Check: actor_user_id != auth.uid() is rejected
SELECT throws_ok(
    $$ INSERT INTO public.audit_logs (actor_user_id, action) VALUES ('20202020-2020-2020-2020-202020202020', 'unauthorized.action') $$,
    42501,
    NULL,
    'audit_logs insert with actor_user_id != auth.uid() is rejected by RLS WITH CHECK'
);

-- 5. Audit Logs UPDATE Restriction: UPDATE by authenticated has no effect
DO $$
BEGIN
    UPDATE public.audit_logs SET action = 'tampered' WHERE id = 'a1111111-1111-1111-1111-111111111111';
END $$;

SELECT is(
    (SELECT action FROM public.audit_logs WHERE id = 'a1111111-1111-1111-1111-111111111111'),
    'user.login',
    'UPDATE on audit_logs by authenticated user has no effect (no UPDATE policy)'
);

-- 6. Audit Logs DELETE Restriction: DELETE by authenticated has no effect
DO $$
BEGIN
    DELETE FROM public.audit_logs WHERE id = 'a1111111-1111-1111-1111-111111111111';
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.audit_logs WHERE id = 'a1111111-1111-1111-1111-111111111111'),
    1,
    'DELETE on audit_logs by authenticated user has no effect (no DELETE policy)'
);

-- 7. Reports Insertion with scan_id set succeeds
DO $$
BEGIN
    INSERT INTO public.reports (id, project_id, scan_id, report_type)
    VALUES ('rep11111-1111-1111-1111-111111111111', 'p10101010-1010-1010-1010-101010101010', 's10101010-1010-1010-1010-101010101010', 'visibility_snapshot');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.reports WHERE id = 'rep11111-1111-1111-1111-111111111111'),
    1,
    'reports insert with scan_id set succeeds'
);

-- 8. Reports Insertion with scan_id NULL succeeds
DO $$
BEGIN
    INSERT INTO public.reports (id, project_id, report_type, date_range_start, date_range_end)
    VALUES ('rep22222-2222-2222-2222-222222222222', 'p10101010-1010-1010-1010-101010101010', 'monthly_audit', '2026-08-01', '2026-08-07');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.reports WHERE id = 'rep22222-2222-2222-2222-222222222222'),
    1,
    'reports insert with scan_id NULL and date range set succeeds'
);

-- 9. Reports Enum Constraint: invalid file_format string rejected
SELECT throws_ok(
    $$ INSERT INTO public.reports (project_id, report_type, file_format) VALUES ('p10101010-1010-1010-1010-101010101010', 'summary', 'docx'::public.report_file_format) $$,
    22P02,
    NULL,
    'Invalid report_file_format enum value is rejected'
);

-- 10. Reports Version Constraint: report_version=0 is rejected
SELECT throws_ok(
    $$ INSERT INTO public.reports (project_id, report_type, report_version) VALUES ('p10101010-1010-1010-1010-101010101010', 'summary', 0) $$,
    23514,
    NULL,
    'report_version=0 is rejected by chk_reports_version'
);

-- 11. Reports Date Range Constraint: date_range_start > date_range_end is rejected
SELECT throws_ok(
    $$ INSERT INTO public.reports (project_id, report_type, date_range_start, date_range_end) VALUES ('p10101010-1010-1010-1010-101010101010', 'summary', '2026-08-10', '2026-08-01') $$,
    23514,
    NULL,
    'date_range_start after date_range_end is rejected by chk_reports_date_range'
);

-- 12. Authenticated user CAN hard-DELETE their own reports row
DELETE FROM public.reports WHERE id = 'rep11111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT count(*)::integer FROM public.reports WHERE id = 'rep11111-1111-1111-1111-111111111111'),
    0,
    'Authenticated owner CAN hard-DELETE their own reports row'
);

-- 13. Cross-User RLS Isolation: Other user gets 0 rows across all 3 tables
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '20202020-2020-2020-2020-202020202020';

SELECT is((SELECT count(*)::integer FROM public.jobs), 0, 'Cross-user SELECT on jobs returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.audit_logs), 0, 'Cross-user SELECT on audit_logs returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.reports), 0, 'Cross-user SELECT on reports returns 0 rows');

-- 14. Hard DELETE on jobs by authenticated user has no effect (no DELETE policy)
SET LOCAL "request.jwt.claim.sub" = '10101010-1010-1010-1010-101010101010';

DELETE FROM public.jobs WHERE id = 'j1111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT count(*)::integer FROM public.jobs WHERE id = 'j1111111-1111-1111-1111-111111111111'),
    1,
    'Hard DELETE on jobs by authenticated user has no effect (no DELETE policy)'
);

-- Final Verification
SELECT pass('DB-08 Jobs, Audit Logs & Reports test suite completed successfully');

SELECT * FROM finish();

ROLLBACK;
