-- Test Suite: 0013_entity_mentions.sql
-- Description: Tests tracked_entities (case-insensitive uniqueness, global read/write, no update/delete) and entity_mentions (multi-mention per scan, project-scoped RLS, immutability, Data API grants).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(16);

-- Helper function to fetch granted privilege types as text array
CREATE OR REPLACE FUNCTION _get_granted_privileges(p_grantee text, p_table text)
RETURNS text[] LANGUAGE sql AS $$
    SELECT COALESCE(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
    FROM information_schema.table_privileges
    WHERE grantee = p_grantee AND table_schema = 'public' AND table_name = p_table;
$$;

-- 1. Table Existence Verification (2 assertions)
SELECT ok(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tracked_entities'),
    'tracked_entities table must exist'
);

SELECT ok(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entity_mentions'),
    'entity_mentions table must exist'
);

-- Setup test users, projects, LLM provider, and scans
DO $$
DECLARE
    v_gemini_id UUID;
BEGIN
    SELECT id INTO v_gemini_id FROM public.providers WHERE slug = 'gemini';

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'user_a_em@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'user_b_em@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES 
        ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Project A', 'project-a'),
        ('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Project B', 'project-b');

    INSERT INTO public.ai_scans (id, project_id, provider_id, prompt_text, status)
    VALUES
        ('s1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', v_gemini_id, 'Prompt scan A', 'completed'),
        ('s2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', v_gemini_id, 'Prompt scan B', 'completed');
END $$;

-- 2. Global tracked_entities Operations & Case-Insensitive Uniqueness (4 assertions)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

DO $$
BEGIN
    INSERT INTO public.tracked_entities (name, entity_type) VALUES ('Acme Corp', 'brand');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.tracked_entities WHERE name = 'Acme Corp'),
    1,
    'User A can INSERT into tracked_entities'
);

SELECT throws_ok(
    $$ INSERT INTO public.tracked_entities (name, entity_type) VALUES ('acme corp', 'brand') $$,
    '23505',
    NULL,
    'Inserting tracked_entities with same name different casing is rejected by uq_tracked_entities_name_lower'
);

SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

SELECT is(
    (SELECT count(*)::integer FROM public.tracked_entities WHERE name = 'Acme Corp'),
    1,
    'User B can SELECT global tracked_entities registered by User A'
);

DO $$
BEGIN
    INSERT INTO public.tracked_entities (name, entity_type) VALUES ('Globex Corp', 'organization');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.tracked_entities WHERE name = 'Globex Corp'),
    1,
    'User B can INSERT global tracked_entities'
);

-- 3. entity_mentions RLS, Multi-Mentions per Scan & Cross-User Isolation (4 assertions)
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    v_entity_id UUID;
BEGIN
    SELECT id INTO v_entity_id FROM public.tracked_entities WHERE name = 'Acme Corp';
    
    INSERT INTO public.entity_mentions (tracked_entity_id, ai_scan_id, context_snippet, sentiment)
    VALUES (v_entity_id, 's1111111-1111-1111-1111-111111111111', 'Acme Corp is a leader.', 'positive');

    INSERT INTO public.entity_mentions (tracked_entity_id, ai_scan_id, context_snippet, sentiment)
    VALUES (v_entity_id, 's1111111-1111-1111-1111-111111111111', 'Acme Corp pricing is high.', 'negative');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.entity_mentions WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111'),
    2,
    'Multiple entity_mentions rows allowed for the same (ai_scan_id, tracked_entity_id)'
);

SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

SELECT is(
    (SELECT count(*)::integer FROM public.entity_mentions WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111'),
    0,
    'Cross-user SELECT on entity_mentions for User A scan returns zero rows for User B'
);

SELECT throws_ok(
    $$ INSERT INTO public.entity_mentions (tracked_entity_id, ai_scan_id, context_snippet) VALUES ((SELECT id FROM public.tracked_entities WHERE name = 'Acme Corp'), 's1111111-1111-1111-1111-111111111111', 'Unauthorized mention') $$,
    '42501',
    NULL,
    'User B cannot INSERT entity_mentions for User A scan'
);

DO $$
DECLARE
    v_entity_id UUID;
BEGIN
    SELECT id INTO v_entity_id FROM public.tracked_entities WHERE name = 'Globex Corp';
    INSERT INTO public.entity_mentions (tracked_entity_id, ai_scan_id, context_snippet, sentiment)
    VALUES (v_entity_id, 's2222222-2222-2222-2222-222222222222', 'Globex is growing.', 'neutral');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.entity_mentions WHERE ai_scan_id = 's2222222-2222-2222-2222-222222222222'),
    1,
    'User B can INSERT entity_mentions for own scan'
);

-- 4. Hard UPDATE and DELETE Restrictions for Authenticated (2 assertions)
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

DO $$
BEGIN
    UPDATE public.tracked_entities SET name = 'Hacked Name' WHERE name = 'Acme Corp';
    DELETE FROM public.tracked_entities WHERE name = 'Acme Corp';
END $$;

SELECT is(
    (SELECT name FROM public.tracked_entities WHERE id = (SELECT tracked_entity_id FROM public.entity_mentions WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111' LIMIT 1)),
    'Acme Corp',
    'Authenticated UPDATE and DELETE on tracked_entities has no effect'
);

DO $$
BEGIN
    UPDATE public.entity_mentions SET context_snippet = 'Hacked Snippet' WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111';
    DELETE FROM public.entity_mentions WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111';
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.entity_mentions WHERE ai_scan_id = 's1111111-1111-1111-1111-111111111111'),
    2,
    'Authenticated UPDATE and DELETE on entity_mentions has no effect'
);

-- 5. Data API Grants & Anon Privilege Verification (4 assertions)
RESET ROLE;

SELECT is(_get_granted_privileges('authenticated', 'tracked_entities'), ARRAY['INSERT', 'SELECT'], 'tracked_entities table privileges for authenticated');
SELECT is(_get_granted_privileges('authenticated', 'entity_mentions'), ARRAY['INSERT', 'SELECT'], 'entity_mentions table privileges for authenticated');
SELECT is(_get_granted_privileges('anon', 'tracked_entities'), ARRAY[]::text[], 'anon has zero privileges on tracked_entities');
SELECT is(_get_granted_privileges('anon', 'entity_mentions'), ARRAY[]::text[], 'anon has zero privileges on entity_mentions');

SELECT * FROM finish();

ROLLBACK;
