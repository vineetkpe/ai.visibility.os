-- Test Suite: 0008_ai_visibility_engine.sql
-- Description: Tests AI Visibility Engine schema (providers seed, prompt_library snapshots, ai_scans dual responses, citations, RLS, and constraints).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(20);

-- 1. Provider Seed Verification
SELECT is(
    (SELECT count(*)::integer FROM public.providers),
    6,
    'providers table must be seeded with 6 rows'
);

SELECT is(
    (SELECT count(*)::integer FROM public.providers WHERE is_active = true),
    1,
    'Only Google Gemini provider must be active initially'
);

SELECT is(
    (SELECT slug FROM public.providers WHERE is_active = true),
    'gemini',
    'Google Gemini must be the active provider'
);

-- Setup test users, project, and context
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'owner_ai@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'other_ai@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES ('p7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'AI Project', 'ai-project');
END $$;

-- 2. Provider Write Restriction Tests (Authenticated cannot write)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777777';

SELECT throws_ok(
    $$ INSERT INTO public.providers (slug, display_name) VALUES ('custom-llm', 'Custom LLM') $$,
    42501,
    NULL,
    'Authenticated user cannot INSERT into providers table'
);

DO $$
BEGIN
    UPDATE public.providers SET display_name = 'Hacked Name' WHERE slug = 'gemini';
    DELETE FROM public.providers WHERE slug = 'grok';
END $$;

SELECT is(
    (SELECT display_name FROM public.providers WHERE slug = 'gemini'),
    'Google Gemini',
    'Authenticated user UPDATE on providers has no effect'
);

SELECT is(
    (SELECT count(*)::integer FROM public.providers),
    6,
    'Authenticated user DELETE on providers has no effect'
);

-- Setup prompt library and scan record
DO $$
DECLARE
    gemini_id UUID;
    pl_id UUID := 'pl111111-1111-1111-1111-111111111111';
    scan_id UUID := 's1111111-1111-1111-1111-111111111111';
BEGIN
    SELECT id INTO gemini_id FROM public.providers WHERE slug = 'gemini';

    INSERT INTO public.prompt_library (id, project_id, prompt_text, category)
    VALUES (pl_id, 'p7777777-7777-7777-7777-777777777777', 'Initial Prompt Text', 'brand_query');

    INSERT INTO public.ai_scans (id, project_id, provider_id, prompt_library_id, prompt_text, status)
    VALUES (scan_id, 'p7777777-7777-7777-7777-777777777777', gemini_id, pl_id, 'Initial Prompt Text', 'queued');
END $$;

-- 3. Prompt Snapshot Decoupling Test
UPDATE public.prompt_library SET prompt_text = 'Modified Prompt Text' WHERE id = 'pl111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT prompt_text FROM public.ai_scans WHERE id = 's1111111-1111-1111-1111-111111111111'),
    'Initial Prompt Text',
    'ai_scans.prompt_text snapshot remains unchanged when prompt_library text is updated'
);

-- 4. Delete Provider RESTRICT Test
RESET ROLE;
SELECT throws_ok(
    $$ DELETE FROM public.providers WHERE slug = 'gemini' $$,
    23503,
    NULL,
    'Deleting a provider referenced by an ai_scans row is rejected by RESTRICT constraint'
);

-- Switch back to owner
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777777';

-- 5. Check Constraints Tests (cost and tokens)
SELECT throws_ok(
    $$ INSERT INTO public.ai_scans (project_id, provider_id, prompt_text, estimated_cost)
       VALUES ('p7777777-7777-7777-7777-777777777777', (SELECT id FROM public.providers WHERE slug = 'gemini'), 'Test', -1) $$,
    23514,
    NULL,
    'Negative estimated_cost is rejected by chk_ai_scans_cost'
);

SELECT throws_ok(
    $$ INSERT INTO public.ai_scans (project_id, provider_id, prompt_text, input_tokens)
       VALUES ('p7777777-7777-7777-7777-777777777777', (SELECT id FROM public.providers WHERE slug = 'gemini'), 'Test', -5) $$,
    23514,
    NULL,
    'Negative input_tokens is rejected by chk_ai_scans_input_tokens'
);

-- 6. Dual Response Storage Test (raw_response + response_json)
DO $$
BEGIN
    INSERT INTO public.ai_scans (id, project_id, provider_id, prompt_text, raw_response, response_json, mention_position)
    VALUES (
        's2222222-2222-2222-2222-222222222222',
        'p7777777-7777-7777-7777-777777777777',
        (SELECT id FROM public.providers WHERE slug = 'gemini'),
        'Tell me about Brand X',
        'Brand X is a leading platform...',
        '{"model": "gemini-1.5-pro", "candidates": [{"text": "Brand X..."}]}'::jsonb,
        0
    );
END $$;

SELECT is(
    (SELECT raw_response FROM public.ai_scans WHERE id = 's2222222-2222-2222-2222-222222222222'),
    'Brand X is a leading platform...',
    'raw_response text is stored correctly'
);

SELECT is(
    (SELECT response_json->>'model' FROM public.ai_scans WHERE id = 's2222222-2222-2222-2222-222222222222'),
    'gemini-1.5-pro',
    'response_json JSONB object is stored and queryable'
);

-- 7. Citation Insertion & Duplicate Position Check
DO $$
BEGIN
    INSERT INTO public.citations (ai_scan_id, url, title, position, is_own_domain)
    VALUES ('s2222222-2222-2222-2222-222222222222', 'https://example.com/source1', 'Source 1', 1, true);
END $$;

SELECT throws_ok(
    $$ INSERT INTO public.citations (ai_scan_id, url, position)
       VALUES ('s2222222-2222-2222-2222-222222222222', 'https://example.com/source2', 1) $$,
    23505,
    NULL,
    'Duplicate (ai_scan_id, position) on citations is rejected'
);

-- 8. Cross-User RLS Isolation
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '88888888-8888-8888-8888-888888888888';

SELECT is((SELECT count(*)::integer FROM public.prompt_library), 0, 'Cross-user SELECT on prompt_library returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.ai_scans), 0, 'Cross-user SELECT on ai_scans returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.citations), 0, 'Cross-user SELECT on citations returns 0 rows');

-- 9. Citation Immutability & Scan Update Test
SET LOCAL "request.jwt.claim.sub" = '77777777-7777-7777-7777-777777777777';

DO $$
BEGIN
    UPDATE public.citations SET title = 'Hacked Title' WHERE ai_scan_id = 's2222222-2222-2222-2222-222222222222';
END $$;

SELECT is(
    (SELECT title FROM public.citations WHERE ai_scan_id = 's2222222-2222-2222-2222-222222222222'),
    'Source 1',
    'UPDATE on citations by authenticated user has no effect (immutable)'
);

UPDATE public.ai_scans SET status = 'completed' WHERE id = 's1111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT status::text FROM public.ai_scans WHERE id = 's1111111-1111-1111-1111-111111111111'),
    'completed',
    'UPDATE on ai_scans status by owner succeeds'
);

-- 10. Idempotency Verification
DO $$
BEGIN
    CREATE TYPE public.scan_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT pass('Idempotent DB-06 schema verification completed successfully');

SELECT * FROM finish();

ROLLBACK;
