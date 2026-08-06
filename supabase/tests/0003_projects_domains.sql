-- Test Suite: 0003_projects_domains.sql
-- Description: Tests projects and domains tables, foreign keys, RLS isolation, primary domain constraint, host format validation, and soft delete rules.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(15);

-- 1. Table & Constraint Verifications
SELECT has_table('projects', 'public.projects table must exist');
SELECT has_table('domains', 'public.domains table must exist');
SELECT has_pk('projects', 'pk_projects primary key constraint must exist');
SELECT has_pk('domains', 'pk_domains primary key constraint must exist');
SELECT fk_ok('public', 'projects', 'user_id', 'public', 'users', 'id', 'fk_projects_user foreign key must reference public.users(id)');
SELECT fk_ok('public', 'domains', 'project_id', 'public', 'projects', 'id', 'fk_domains_project foreign key must reference public.projects(id)');

-- 2. RLS Verification
SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'projects'),
    true,
    'RLS must be enabled on public.projects'
);

SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'domains'),
    true,
    'RLS must be enabled on public.domains'
);

-- Setup test users
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'owner@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'other@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');
END $$;

-- 3. Authenticated Project & Primary Domain Creation Test
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    new_project_id UUID := 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
BEGIN
    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES (new_project_id, '33333333-3333-3333-3333-333333333333', 'My First Project', 'my-first-project');

    INSERT INTO public.domains (project_id, host, is_primary)
    VALUES (new_project_id, 'example.com', true);
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE user_id = '33333333-3333-3333-3333-333333333333'),
    1,
    'Authenticated user can insert their own project'
);

-- 4. Cross-User Isolation Test (Switch to User 4)
SET LOCAL "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444444';

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
    0,
    'User 4 cannot SELECT User 3 project (RLS isolation)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.domains WHERE project_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
    0,
    'User 4 cannot SELECT User 3 domains (RLS EXISTS isolation)'
);

-- Reset back to User 3
SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';

-- 5. Primary Domain Partial Unique Index Test (attempt second primary domain)
SELECT throws_ok(
    $$ INSERT INTO public.domains (project_id, host, is_primary) VALUES ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'secondary.com', true) $$,
    '23505', -- unique violation
    NULL,
    'Inserting a second is_primary=true domain on the same project must be rejected by uq_domains_project_primary'
);

-- 6. Host Format CHECK Constraint Test
SELECT throws_ok(
    $$ INSERT INTO public.domains (project_id, host, is_primary) VALUES ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'https://example.com/', false) $$,
    '23514', -- check constraint violation
    NULL,
    'Inserting host with scheme/slash must be rejected by chk_domains_host_format'
);

SELECT throws_ok(
    $$ INSERT INTO public.domains (project_id, host, is_primary) VALUES ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'UPPERCASE.COM', false) $$,
    '23514',
    NULL,
    'Inserting host with uppercase characters must be rejected by chk_domains_host_format'
);

-- 7. Hard DELETE Rejection Test
DO $$
BEGIN
    DELETE FROM public.projects WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
    1,
    'Hard DELETE on projects by authenticated user has no effect (no DELETE policy exists)'
);

-- 8. Soft DELETE Test
DO $$
BEGIN
    UPDATE public.projects SET deleted_at = now() WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
END $$;

SELECT is(
    (SELECT (deleted_at IS NOT NULL) FROM public.projects WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
    true,
    'Soft delete via UPDATE deleted_at = now() succeeds'
);

SELECT * FROM finish();

ROLLBACK;
