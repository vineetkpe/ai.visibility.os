-- Test Suite: 0002_users_profile.sql
-- Description: Tests public.users profile creation, handle_new_user trigger, RLS policies, and privilege escalation prevention.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(11);

-- 1. Table & Constraint Verification
SELECT has_table('users', 'public.users table must exist');
SELECT has_pk('users', 'pk_users primary key constraint must exist');
SELECT fk_ok('users', 'id', 'auth', 'users', 'id', 'fk_users_auth_user foreign key must reference auth.users(id)');

-- 2. RLS Verification
SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'users'),
    true,
    'RLS must be enabled on public.users'
);

-- 3. Simulate Signup: Insert into auth.users and verify handle_new_user trigger
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'testuser@example.com',
        'password_hash',
        now(),
        '{"full_name": "Test User", "avatar_url": "https://example.com/avatar.png"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated'
    );
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111'),
    1,
    'Inserting into auth.users must auto-provision public.users profile row'
);

SELECT is(
    (SELECT role::text FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111'),
    'user',
    'Default role must be user'
);

SELECT is(
    (SELECT is_onboarded FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111'),
    false,
    'Default is_onboarded must be false'
);

-- 4. Test OAuth Re-login / UPSERT behavior
DO $$
BEGIN
    INSERT INTO public.users (id, display_name, avatar_url)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Updated Test User', 'https://example.com/new_avatar.png')
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
END $$;

SELECT is(
    (SELECT display_name FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111'),
    'Updated Test User',
    'UPSERT updates display_name on re-login without duplicating rows'
);

-- 5. RLS Cross-User Isolation Test
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'otheruser@example.com',
        'password_hash',
        now(),
        '{"full_name": "Other User"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated'
    );
END $$;

-- Switch to authenticated role impersonating User 1
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT count(*)::integer FROM public.users WHERE id = '22222222-2222-2222-2222-222222222222'),
    0,
    'Authenticated user cannot SELECT another user profile (RLS cross-user isolation)'
);

-- 6. Privilege Escalation Prevention Tests
SELECT throws_ok(
    $$ UPDATE public.users SET role = 'admin' WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    '42501',
    NULL,
    'Attempting to update role by authenticated role must be rejected by column-level grants'
);

SELECT throws_ok(
    $$ UPDATE public.users SET is_onboarded = true WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    '42501',
    NULL,
    'Attempting to update is_onboarded by authenticated role must be rejected by column-level grants'
);

SELECT * FROM finish();

ROLLBACK;
