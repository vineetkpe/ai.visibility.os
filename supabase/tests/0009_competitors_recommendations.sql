-- Test Suite: 0009_competitors_recommendations.sql
-- Description: Tests Competitors & Recommendations schema (domain_type checks, competitor trigger enforcement, scope_key partial unique index dedup & versioning, score/enum constraints, evidence sources & CASCADE, RLS, and hard-DELETE permissions).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(22);

-- Setup test users, provider, project, domains, and scan record
DO $$
DECLARE
    gemini_id UUID;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'owner_comp@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'other_comp@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES 
        ('p9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'Owner Project', 'owner-project'),
        ('paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Other Project', 'other-project');

    INSERT INTO public.domains (id, project_id, host, domain_type, is_primary)
    VALUES 
        ('d1111111-1111-1111-1111-111111111111', 'p9999999-9999-9999-9999-999999999999', 'own.example.com', 'own', true),
        ('d2222222-2222-2222-2222-222222222222', 'p9999999-9999-9999-9999-999999999999', 'competitor.example.com', 'competitor', false);

    SELECT id INTO gemini_id FROM public.providers WHERE slug = 'gemini';

    INSERT INTO public.ai_scans (id, project_id, provider_id, prompt_text, status)
    VALUES 
        ('s9999999-9999-9999-9999-999999999999', 'p9999999-9999-9999-9999-999999999999', gemini_id, 'Test Prompt', 'completed');
END $$;

-- Switch context to project owner
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999999';

-- 1. Domain Check Constraint: domain_type='competitor' with is_primary=true is rejected
SELECT throws_ok(
    $$ INSERT INTO public.domains (project_id, host, domain_type, is_primary) VALUES ('p9999999-9999-9999-9999-999999999999', 'bad.competitor.com', 'competitor', true) $$,
    23514,
    NULL,
    'Inserting domain with domain_type=competitor and is_primary=true is rejected by chk_domains_competitor_not_primary'
);

-- 2. Competitors Trigger Enforcement: competitor pointing to domain_type='own' is rejected
SELECT throws_ok(
    $$ INSERT INTO public.competitors (project_id, domain_id, name) VALUES ('p9999999-9999-9999-9999-999999999999', 'd1111111-1111-1111-1111-111111111111', 'Invalid Own Competitor') $$,
    'P0001',
    'competitors.domain_id must reference a domains row with domain_type = ''competitor''',
    'Inserting competitor pointing to domain_type=own is rejected by enforcement trigger'
);

-- 3. Competitor Insertion: pointing to domain_type='competitor' succeeds
DO $$
BEGIN
    INSERT INTO public.competitors (id, project_id, domain_id, name, source, status)
    VALUES ('c1111111-1111-1111-1111-111111111111', 'p9999999-9999-9999-9999-999999999999', 'd2222222-2222-2222-2222-222222222222', 'Competitor One', 'user_added', 'confirmed');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.competitors WHERE id = 'c1111111-1111-1111-1111-111111111111'),
    1,
    'Inserting competitor pointing to domain_type=competitor succeeds'
);

-- 4. Duplicate (project_id, domain_id) on competitors is rejected
SELECT throws_ok(
    $$ INSERT INTO public.competitors (project_id, domain_id, name) VALUES ('p9999999-9999-9999-9999-999999999999', 'd2222222-2222-2222-2222-222222222222', 'Duplicate Competitor') $$,
    23505,
    NULL,
    'Duplicate (project_id, domain_id) on competitors is rejected by uq_competitors_project_domain'
);

-- 5. Citation Check Constraint: competitor_id set with is_own_domain=true is rejected
SELECT throws_ok(
    $$ INSERT INTO public.citations (ai_scan_id, url, position, is_own_domain, competitor_id)
       VALUES ('s9999999-9999-9999-9999-999999999999', 'https://competitor.example.com/page', 1, true, 'c1111111-1111-1111-1111-111111111111') $$,
    23514,
    NULL,
    'Citation with competitor_id set and is_own_domain=true is rejected by chk_citations_competitor_not_own'
);

-- 6. Citation Insertion with competitor_id succeeds
DO $$
BEGIN
    INSERT INTO public.citations (id, ai_scan_id, url, position, is_own_domain, competitor_id)
    VALUES ('cit11111-1111-1111-1111-111111111111', 's9999999-9999-9999-9999-999999999999', 'https://competitor.example.com/page', 1, false, 'c1111111-1111-1111-1111-111111111111');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.citations WHERE id = 'cit11111-1111-1111-1111-111111111111'),
    1,
    'Inserting citation referencing competitor_id with is_own_domain=false succeeds'
);

-- 7. Recommendation Scope Key Dedup: Duplicate active (project_id, scope_key) is rejected
DO $$
BEGIN
    INSERT INTO public.recommendations (id, project_id, category, title, impact_score, effort_score, priority, scope_key)
    VALUES ('r1111111-1111-1111-1111-111111111111', 'p9999999-9999-9999-9999-999999999999', 'schema', 'Add FAQ Schema', 4, 2, 'high', 'rec_faq_schema');
END $$;

SELECT throws_ok(
    $$ INSERT INTO public.recommendations (project_id, category, title, impact_score, effort_score, priority, scope_key)
       VALUES ('p9999999-9999-9999-9999-999999999999', 'schema', 'Add Duplicate FAQ Schema', 3, 1, 'medium', 'rec_faq_schema') $$,
    23505,
    NULL,
    'Duplicate active (project_id, scope_key) on recommendations is rejected by partial unique index'
);

-- 8. Impact Score Check Constraint: impact_score=6 is rejected
SELECT throws_ok(
    $$ INSERT INTO public.recommendations (project_id, category, title, impact_score, effort_score, priority, scope_key)
       VALUES ('p9999999-9999-9999-9999-999999999999', 'schema', 'Invalid Impact Score', 6, 2, 'high', 'rec_invalid_impact') $$,
    23514,
    NULL,
    'impact_score=6 is rejected by chk_recommendations_impact'
);

-- 9. Priority Enum Constraint: invalid enum string rejected
SELECT throws_ok(
    $$ INSERT INTO public.recommendations (project_id, category, title, impact_score, effort_score, priority, scope_key)
       VALUES ('p9999999-9999-9999-9999-999999999999', 'schema', 'Invalid Priority', 4, 2, 'urgent'::public.recommendation_priority, 'rec_invalid_priority') $$,
    22P02,
    NULL,
    'Invalid recommendation_priority enum value is rejected'
);

-- 10. Evidence Source Check Constraint: all 4 source FKs NULL is rejected
SELECT throws_ok(
    $$ INSERT INTO public.recommendation_evidence (recommendation_id, notes)
       VALUES ('r1111111-1111-1111-1111-111111111111', 'Evidence without source FKs') $$,
    23514,
    NULL,
    'Recommendation evidence with all four source FKs NULL is rejected by chk_recommendation_evidence_has_source'
);

-- 11. Evidence Insertion with competitor_id source succeeds
DO $$
BEGIN
    INSERT INTO public.recommendation_evidence (id, recommendation_id, competitor_id, notes)
    VALUES ('e1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Competitor gap evidence');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.recommendation_evidence WHERE id = 'e1111111-1111-1111-1111-111111111111'),
    1,
    'Inserting recommendation_evidence with competitor_id source succeeds'
);

-- 12. Evidence Insertion with ai_scan_id source succeeds (separate row for RLS delete testing)
DO $$
BEGIN
    INSERT INTO public.recommendation_evidence (id, recommendation_id, ai_scan_id, notes)
    VALUES ('e2222222-2222-2222-2222-222222222222', 'r1111111-1111-1111-1111-111111111111', 's9999999-9999-9999-9999-999999999999', 'Scan source evidence');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.recommendation_evidence WHERE id = 'e2222222-2222-2222-2222-222222222222'),
    1,
    'Inserting recommendation_evidence with ai_scan_id source succeeds'
);

-- 13. Recommendation Versioning Test: Insert second recommendation with SAME scope_key after setting first row superseded_by
DO $$
BEGIN
    INSERT INTO public.recommendations (id, project_id, category, title, impact_score, effort_score, priority, scope_key)
    VALUES ('r2222222-2222-2222-2222-222222222222', 'p9999999-9999-9999-9999-999999999999', 'schema', 'Updated FAQ Schema v2', 5, 2, 'critical', 'rec_faq_schema');

    UPDATE public.recommendations
    SET superseded_by = 'r2222222-2222-2222-2222-222222222222'
    WHERE id = 'r1111111-1111-1111-1111-111111111111';
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.recommendations WHERE id = 'r2222222-2222-2222-2222-222222222222'),
    1,
    'Inserting second recommendation with same scope_key succeeds after superseded_by is set on first row'
);

-- 14. Versioning Conflict Test: Attempt inserting THIRD recommendation with same scope_key while second row superseded_by IS NULL
SELECT throws_ok(
    $$ INSERT INTO public.recommendations (id, project_id, category, title, impact_score, effort_score, priority, scope_key)
       VALUES ('r3333333-3333-3333-3333-333333333333', 'p9999999-9999-9999-9999-999999999999', 'schema', 'Conflicting FAQ Schema v3', 4, 1, 'high', 'rec_faq_schema') $$,
    23505,
    NULL,
    'Inserting third recommendation with same scope_key while active version exists is rejected by partial unique index'
);

-- 15. Cross-User RLS Isolation: Other user gets 0 rows
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT is((SELECT count(*)::integer FROM public.competitors), 0, 'Cross-user SELECT on competitors returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.recommendations), 0, 'Cross-user SELECT on recommendations returns 0 rows');
SELECT is((SELECT count(*)::integer FROM public.recommendation_evidence), 0, 'Cross-user SELECT on recommendation_evidence returns 0 rows');

-- 16. Hard-DELETE permissions verification
SET LOCAL "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999999';

-- Authenticated user CAN hard-DELETE their own competitors row (e1111111 will CASCADE delete with competitor)
DELETE FROM public.competitors WHERE id = 'c1111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT count(*)::integer FROM public.recommendation_evidence WHERE id = 'e1111111-1111-1111-1111-111111111111'),
    0,
    'recommendation_evidence with competitor as sole source is CASCADE-deleted when the competitor is deleted'
);

SELECT is(
    (SELECT count(*)::integer FROM public.competitors WHERE id = 'c1111111-1111-1111-1111-111111111111'),
    0,
    'Authenticated owner CAN hard-DELETE their own competitors row'
);

-- Hard DELETE on recommendation_evidence e2222222 by authenticated user has no effect (no DELETE policy)
DELETE FROM public.recommendation_evidence WHERE id = 'e2222222-2222-2222-2222-222222222222';

SELECT is(
    (SELECT count(*)::integer FROM public.recommendation_evidence WHERE id = 'e2222222-2222-2222-2222-222222222222'),
    1,
    'Hard DELETE on recommendation_evidence by authenticated user has no effect (no DELETE policy)'
);

-- Hard DELETE on recommendations by authenticated user has no effect (no DELETE policy)
DELETE FROM public.recommendations WHERE id = 'r1111111-1111-1111-1111-111111111111';

SELECT is(
    (SELECT count(*)::integer FROM public.recommendations WHERE id = 'r1111111-1111-1111-1111-111111111111'),
    1,
    'Hard DELETE on recommendations by authenticated user has no effect (no DELETE policy)'
);

-- Final Verification
SELECT pass('DB-07 Competitors & Recommendations test suite completed successfully');

SELECT * FROM finish();

ROLLBACK;
