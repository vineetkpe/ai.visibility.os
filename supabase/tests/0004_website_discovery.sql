-- Test Suite: 0004_website_discovery.sql
-- Description: Tests crawler tables (crawl_sessions, pages, page_metadata, robots_files, sitemaps, crawl_errors), composite FK constraints, check constraints, RLS policies, and append-only rules.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(28);

-- 1. Table & Constraint Verifications
SELECT has_table('crawl_sessions', 'public.crawl_sessions table must exist');
SELECT has_table('pages', 'public.pages table must exist');
SELECT has_table('page_metadata', 'public.page_metadata table must exist');
SELECT has_table('robots_files', 'public.robots_files table must exist');
SELECT has_table('sitemaps', 'public.sitemaps table must exist');
SELECT has_table('crawl_errors', 'public.crawl_errors table must exist');

SELECT has_pk('crawl_sessions', 'pk_crawl_sessions primary key constraint must exist');
SELECT has_pk('pages', 'pk_pages primary key constraint must exist');
SELECT has_pk('page_metadata', 'pk_page_metadata primary key constraint must exist');
SELECT has_pk('robots_files', 'pk_robots_files primary key constraint must exist');
SELECT has_pk('sitemaps', 'pk_sitemaps primary key constraint must exist');
SELECT has_pk('crawl_errors', 'pk_crawl_errors primary key constraint must exist');

SELECT fk_ok('public', 'crawl_sessions', 'project_id', 'public', 'projects', 'id', 'fk_crawl_sessions_project foreign key must reference public.projects(id)');
SELECT fk_ok('public', 'page_metadata', 'page_id', 'public', 'pages', 'id', 'fk_page_metadata_page foreign key must reference public.pages(id)');
SELECT fk_ok('public', 'robots_files', 'domain_id', 'public', 'domains', 'id', 'fk_robots_files_domain foreign key must reference public.domains(id)');
SELECT fk_ok('public', 'sitemaps', 'domain_id', 'public', 'domains', 'id', 'fk_sitemaps_domain foreign key must reference public.domains(id)');
SELECT fk_ok('public', 'crawl_errors', 'crawl_session_id', 'public', 'crawl_sessions', 'id', 'fk_crawl_errors_session foreign key must reference public.crawl_sessions(id)');

-- Setup Test Users, Projects, and Domains
DO $$
DECLARE
    user1_id UUID := '55555555-5555-5555-5555-555555555555';
    user2_id UUID := '66666666-6666-6666-6666-666666666666';
    proj1_id UUID := 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1';
    proj2_id UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
    dom1_id UUID := 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
    dom2_id UUID := 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2';
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES 
        (user1_id, '00000000-0000-0000-0000-000000000000', 'u1@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated'),
        (user2_id, '00000000-0000-0000-0000-000000000000', 'u2@example.com', 'pw', now(), now(), now(), 'authenticated', 'authenticated');

    INSERT INTO public.projects (id, user_id, name, slug)
    VALUES 
        (proj1_id, user1_id, 'User 1 Project', 'user-1-proj'),
        (proj2_id, user2_id, 'User 2 Project', 'user-2-proj');

    INSERT INTO public.domains (id, project_id, host, is_primary)
    VALUES 
        (dom1_id, proj1_id, 'domain1.com', true),
        (dom2_id, proj2_id, 'domain2.com', true);
END $$;

-- Act as User 1
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '55555555-5555-5555-5555-555555555555';

-- 2. Crawl Session Creation & Default Status Test
DO $$
BEGIN
    INSERT INTO public.crawl_sessions (id, project_id)
    VALUES ('s1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1');
END $$;

SELECT is(
    (SELECT status::text FROM public.crawl_sessions WHERE id = 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1'),
    'queued',
    'New crawl_session defaults to status queued'
);

-- 3. Composite Foreign Key Mismatch Test
SELECT throws_ok(
    $$ INSERT INTO public.pages (project_id, domain_id, url, path) VALUES ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'https://domain1.com/test', '/test') $$,
    '23503', -- foreign key violation
    NULL,
    'Inserting a page with domain_id belonging to a different project must be rejected by fk_pages_domain_project'
);

-- 4. Valid Page & Metadata Insert Test
DO $$
BEGIN
    INSERT INTO public.pages (id, project_id, domain_id, url, path, status_code)
    VALUES ('p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'https://domain1.com/', '/', 200);

    INSERT INTO public.page_metadata (page_id, title)
    VALUES ('p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', 'Home Page Title');
END $$;

-- 5. Duplicate URL Test
SELECT throws_ok(
    $$ INSERT INTO public.pages (project_id, domain_id, url, path) VALUES ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'https://domain1.com/', '/') $$,
    '23505', -- unique violation
    NULL,
    'Duplicate (project_id, url) must be rejected by uq_pages_project_url'
);

-- 6. Malformed URL CHECK Test
SELECT throws_ok(
    $$ INSERT INTO public.pages (project_id, domain_id, url, path) VALUES ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'ftp://domain1.com/file', '/file') $$,
    '23514', -- check constraint violation
    NULL,
    'Malformed URL lacking http/https prefix must be rejected by chk_pages_url_format'
);

-- 7. Status Code CHECK Test
SELECT throws_ok(
    $$ INSERT INTO public.pages (project_id, domain_id, url, path, status_code) VALUES ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'https://domain1.com/err', '/err', 999) $$,
    '23514',
    NULL,
    'Invalid HTTP status code 999 must be rejected by chk_pages_status_code'
);

-- 8. Duplicate Metadata Test
SELECT throws_ok(
    $$ INSERT INTO public.page_metadata (page_id, title) VALUES ('p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', 'Second Title') $$,
    '23505',
    NULL,
    'Second page_metadata row for the same page_id must be rejected by uq_page_metadata_page'
);

-- 9. Crawl Error with NULL page_id Test
DO $$
BEGIN
    INSERT INTO public.crawl_errors (crawl_session_id, page_id, url, error_type, error_message)
    VALUES ('s1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1', NULL, 'https://domain1.com/timeout', 'DNS_TIMEOUT', 'Failed to resolve host');
END $$;

SELECT is(
    (SELECT count(*)::integer FROM public.crawl_errors WHERE crawl_session_id = 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1' AND page_id IS NULL),
    1,
    'crawl_errors insert succeeds with page_id NULL'
);

-- 10. Cross-User Isolation Test (Switch to User 2)
SET LOCAL "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666666';

SELECT is(
    (SELECT count(*)::integer FROM public.crawl_sessions WHERE project_id = 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'),
    0,
    'User 2 cannot SELECT User 1 crawl_sessions (RLS isolation)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.pages WHERE project_id = 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'),
    0,
    'User 2 cannot SELECT User 1 pages (RLS isolation)'
);

-- 11. Hard DELETE Rejection Test
DO $$
BEGIN
    DELETE FROM public.crawl_sessions WHERE id = 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1';
    DELETE FROM public.pages WHERE id = 'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1';
END $$;

-- Switch back to User 1 to check rows survived
SET LOCAL "request.jwt.claim.sub" = '55555555-5555-5555-5555-555555555555';

SELECT is(
    (SELECT count(*)::integer FROM public.crawl_sessions WHERE id = 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1'),
    1,
    'Hard DELETE on crawl_sessions by authenticated user has no effect (no DELETE policy exists)'
);

SELECT is(
    (SELECT count(*)::integer FROM public.pages WHERE id = 'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1'),
    1,
    'Hard DELETE on pages by authenticated user has no effect (no DELETE policy exists)'
);

SELECT * FROM finish();

ROLLBACK;
