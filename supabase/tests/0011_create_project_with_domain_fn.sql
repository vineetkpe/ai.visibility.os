-- Test Suite: 0011_create_project_with_domain_fn.sql
-- Description: Tests atomic project & primary domain creation RPC function, orphan prevention on rollback, and RLS isolation.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(8);

-- 1. Function Existence Check
SELECT has_function(
    'create_project_with_domain',
    ARRAY['text', 'text'],
    'Function create_project_with_domain must exist'
);

-- Setup test users
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'user1@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'user2@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.users (id, display_name)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', 'User One'),
        ('22222222-2222-2222-2222-222222222222', 'User Two');
END $$;

-- 2. Authenticated Project & Domain Creation via RPC
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    v_project_id UUID;
BEGIN
    v_project_id := public.create_project_with_domain('Test Project Alpha', 'example.com');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE user_id = '11111111-1111-1111-1111-111111111111'),
    1,
    'Project created successfully via atomic function'
);

SELECT is(
    (SELECT host FROM public.domains WHERE project_id = (SELECT id FROM public.projects WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1)),
    'example.com',
    'Primary domain host matches input'
);

SELECT is(
    (SELECT is_primary FROM public.domains WHERE project_id = (SELECT id FROM public.projects WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1)),
    true,
    'Primary domain is_primary is TRUE'
);

-- 3. Host Format Constraint Failure & Orphan Prevention Test
SELECT throws_ok(
    $$ SELECT public.create_project_with_domain('Invalid Domain Project', 'https://invalid-format.com/') $$,
    '23514',
    NULL,
    'Invalid host format must be rejected by chk_domains_host_format'
);

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE name = 'Invalid Domain Project'),
    0,
    'No orphaned project row is left behind after host format constraint failure'
);

-- 4. RLS Isolation Check (Switch to User 2)
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

SELECT is(
    (SELECT count(*)::integer FROM public.projects WHERE user_id = '11111111-1111-1111-1111-111111111111'),
    0,
    'User 2 cannot SELECT User 1 project (RLS isolation)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.domains WHERE project_id = (SELECT id FROM public.projects WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1)),
    0,
    'User 2 cannot SELECT User 1 domain (RLS isolation)'
);

SELECT * FROM finish();

ROLLBACK;
