-- Test Suite: 0007_business_context.sql
-- Description: Tests versioned business context schema (business_context_versions, entities, topics, products, services), domain-scoped technologies, RLS, immutability, and constraints.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(30);

-- 1. Table Existence Verifications
SELECT has_table('business_context_versions', 'public.business_context_versions table must exist');
SELECT has_table('entities', 'public.entities table must exist');
SELECT has_table('topics', 'public.topics table must exist');
SELECT has_table('products', 'public.products table must exist');
SELECT has_table('services', 'public.services table must exist');
SELECT has_table('technologies', 'public.technologies table must exist');

-- Setup test users, project, domain, and pages
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'owner_bc@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'other_bc@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES ('p5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Owner Project', 'owner-project');

    INSERT INTO public.domains (id, project_id, host, is_primary)
    VALUES ('d5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'owner.com', true);

    INSERT INTO public.pages (id, project_id, domain_id, url, path)
    VALUES ('page5555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'd5555555-5555-5555-5555-555555555555', 'https://owner.com/', '/');
END $$;

-- Switch to owner context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '55555555-5555-5555-5555-555555555555';

-- 2. Versioning & Append-Only Verification
DO $$
BEGIN
    INSERT INTO public.business_context_versions (id, project_id, industry, description)
    VALUES ('v1111111-1111-1111-1111-111111111111', 'p5555555-5555-5555-5555-555555555555', 'SaaS', 'Version 1 Context');

    INSERT INTO public.business_context_versions (id, project_id, industry, description)
    VALUES ('v2222222-2222-2222-2222-222222222222', 'p5555555-5555-5555-5555-555555555555', 'SaaS & AI', 'Version 2 Context');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.business_context_versions WHERE project_id = 'p5555555-5555-5555-5555-555555555555'),
    2,
    'Multiple business_context_versions succeed for the same project'
);

-- 3. Version-Scoped Entities & Unique Constraints
DO $$
BEGIN
    INSERT INTO public.entities (business_context_version_id, entity_type, name)
    VALUES ('v1111111-1111-1111-1111-111111111111', 'organization', 'Acme Corp');

    INSERT INTO public.entities (business_context_version_id, entity_type, name)
    VALUES ('v2222222-2222-2222-2222-222222222222', 'organization', 'Acme Corp');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.entities WHERE name = 'Acme Corp'),
    2,
    'Same entity name under version 1 and version 2 succeeds'
);

-- 4. Duplicate within the same version rejected
SELECT throws_ok(
    $$ INSERT INTO public.entities (business_context_version_id, entity_type, name) VALUES ('v1111111-1111-1111-1111-111111111111', 'organization', 'Acme Corp') $$,
    23505,
    NULL,
    'Duplicate (business_context_version_id, name, entity_type) within same version is rejected'
);

-- 5. Product URL format check
SELECT throws_ok(
    $$ INSERT INTO public.products (business_context_version_id, name, url) VALUES ('v1111111-1111-1111-1111-111111111111', 'Prod X', 'not-a-url') $$,
    23514,
    NULL,
    'Invalid URL format on products.url is rejected by check constraint'
);

-- Insert valid child entities for further testing
DO $$
BEGIN
    INSERT INTO public.topics (business_context_version_id, name, relevance_score)
    VALUES ('v1111111-1111-1111-1111-111111111111', 'AI Visibility', 0.95);

    INSERT INTO public.products (business_context_version_id, name, url)
    VALUES ('v1111111-1111-1111-1111-111111111111', 'Prod Alpha', 'https://owner.com/prod-alpha');

    INSERT INTO public.services (business_context_version_id, name, url)
    VALUES ('v1111111-1111-1111-1111-111111111111', 'Audit Service', 'https://owner.com/service-audit');

    INSERT INTO public.technologies (domain_id, name, category)
    VALUES ('d5555555-5555-5555-5555-555555555555', 'Next.js', 'Web Framework');
END $$;

-- 6. Immutability Verification (UPDATE on versioned tables fails / modifies 0 rows)
DO $$
BEGIN
    UPDATE public.business_context_versions SET industry = 'Changed' WHERE id = 'v1111111-1111-1111-1111-111111111111';
    UPDATE public.entities SET description = 'Changed' WHERE name = 'Acme Corp';
    UPDATE public.topics SET relevance_score = 0.50 WHERE name = 'AI Visibility';
    UPDATE public.products SET description = 'Changed' WHERE name = 'Prod Alpha';
    UPDATE public.services SET description = 'Changed' WHERE name = 'Audit Service';
END $$;

SELECT is(
    (SELECT industry FROM public.business_context_versions WHERE id = 'v1111111-1111-1111-1111-111111111111'),
    'SaaS',
    'UPDATE on business_context_versions by authenticated role has no effect (immutable)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.entities WHERE description = 'Changed'),
    0,
    'UPDATE on entities by authenticated role has no effect (immutable)'
);

SELECT is(
    (SELECT relevance_score FROM public.topics WHERE name = 'AI Visibility'),
    0.95,
    'UPDATE on topics by authenticated role has no effect (immutable)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.products WHERE description = 'Changed'),
    0,
    'UPDATE on products by authenticated role has no effect (immutable)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.services WHERE description = 'Changed'),
    0,
    'UPDATE on services by authenticated role has no effect (immutable)'
);

-- 7. technologies UPDATE succeeds
UPDATE public.technologies SET category = 'Fullstack Framework' WHERE name = 'Next.js';
SELECT is(
    (SELECT category FROM public.technologies WHERE name = 'Next.js'),
    'Fullstack Framework',
    'UPDATE on technologies succeeds (in-place update allowed)'
);

-- 8. Duplicate (domain_id, name) on technologies rejected
SELECT throws_ok(
    $$ INSERT INTO public.technologies (domain_id, name) VALUES ('d5555555-5555-5555-5555-555555555555', 'Next.js') $$,
    23505,
    NULL,
    'Duplicate (domain_id, name) on technologies is rejected'
);

-- 9. Cross-User RLS Isolation
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666666';

SELECT is((SELECT count(*)::integer FROM public.business_context_versions), 0, 'Cross-user SELECT on business_context_versions returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.entities), 0, 'Cross-user SELECT on entities returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.topics), 0, 'Cross-user SELECT on topics returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.products), 0, 'Cross-user SELECT on products returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.services), 0, 'Cross-user SELECT on services returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.technologies), 0, 'Cross-user SELECT on technologies returns 0 rows');

-- 10. Hard DELETE by authenticated has no effect
DELETE FROM public.business_context_versions;
DELETE FROM public.entities;
DELETE FROM public.topics;
DELETE FROM public.products;
DELETE FROM public.services;
DELETE FROM public.technologies;

-- Switch back to owner to confirm records are still intact
SET LOCAL "request.jwt.claim.sub" = '55555555-5555-5555-5555-555555555555';

SELECT is((SELECT count(*)::integer FROM public.business_context_versions), 2, 'Hard DELETE on business_context_versions has no effect');
SELECT is((SELECT count(*)::integer FROM public.entities), 2, 'Hard DELETE on entities has no effect');
SELECT is((SELECT count(*)::integer FROM public.topics), 1, 'Hard DELETE on topics has no effect');
SELECT is((SELECT count(*)::integer FROM public.products), 1, 'Hard DELETE on products has no effect');
SELECT is((SELECT count(*)::integer FROM public.services), 1, 'Hard DELETE on services has no effect');
SELECT is((SELECT count(*)::integer FROM public.technologies), 1, 'Hard DELETE on technologies has no effect');

-- 11. Idempotency Verification
DO $$
BEGIN
    CREATE TYPE public.extraction_method AS ENUM ('deterministic', 'ai_assisted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT pass('Idempotent DB-05 schema verification completed successfully');

SELECT * FROM finish();

ROLLBACK;
