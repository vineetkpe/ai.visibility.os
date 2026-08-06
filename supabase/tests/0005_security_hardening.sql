-- Test Suite: 0005_security_hardening.sql
-- Description: Verifies security hardening pre-DB-05 (proconfig, extension schemas, RPC privileges, event trigger).

BEGIN;

-- Enable pgTAP testing framework extension
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(13);

-- 1. update_updated_at_column proconfig search_path verification
SELECT is(
    (SELECT proconfig IS NOT NULL AND 'search_path=' = ANY(proconfig) FROM pg_proc WHERE proname = 'update_updated_at_column'),
    true,
    'update_updated_at_column function must have non-empty proconfig containing search_path='
);

-- 2. Extension Schema Verification
SELECT is(
    (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'pg_trgm'),
    'extensions',
    'pg_trgm extension must reside in extensions schema'
);

SELECT is(
    (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'unaccent'),
    'extensions',
    'unaccent extension must reside in extensions schema'
);

-- 3. Function Existence Verification (schema changed or updated, function still exists)
SELECT has_function('update_updated_at_column', 'update_updated_at_column function must exist');
SELECT has_function('handle_new_user', 'handle_new_user function must exist');
SELECT has_function('rls_auto_enable', 'rls_auto_enable function must exist');

-- 4. Privilege Revocation Verification
SELECT is(
    has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
    false,
    'EXECUTE on handle_new_user must be revoked for anon role'
);

SELECT is(
    has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
    false,
    'EXECUTE on handle_new_user must be revoked for authenticated role'
);

SELECT is(
    has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE'),
    false,
    'EXECUTE on rls_auto_enable must be revoked for anon role'
);

SELECT is(
    has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE'),
    false,
    'EXECUTE on rls_auto_enable must be revoked for authenticated role'
);

-- 5. Event Trigger Status Verification
SELECT is(
    (SELECT evtenabled FROM pg_event_trigger WHERE evtname = 'ensure_rls'),
    'O',
    'ensure_rls event trigger must exist and be enabled (evtenabled = O)'
);

-- 6. Event Trigger Functional Behavior Verification (Throwaway Table Test)
CREATE TABLE public.tmp_security_hardening_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tmp_security_hardening_test'),
    true,
    'ensure_rls event trigger must automatically set relrowsecurity = true on new tables'
);

DROP TABLE public.tmp_security_hardening_test;

-- 7. Idempotency Verification
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER
    SET search_path = ''
    AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE SCHEMA IF NOT EXISTS extensions;

    IF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'pg_trgm') = 'public' THEN 
        ALTER EXTENSION pg_trgm SET SCHEMA extensions; 
    END IF; 

    IF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'unaccent') = 'public' THEN 
        ALTER EXTENSION unaccent SET SCHEMA extensions; 
    END IF; 

    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

    CREATE OR REPLACE FUNCTION public.rls_auto_enable()
    RETURNS event_trigger
    LANGUAGE plpgsql
    AS $func$
    DECLARE
        cmd record;
    BEGIN
        FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
        LOOP
            IF cmd.object_type = 'table' THEN
                EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
            END IF;
        END LOOP;
    END;
    $func$;

    DROP EVENT TRIGGER IF EXISTS ensure_rls;

    CREATE EVENT TRIGGER ensure_rls 
        ON ddl_command_end 
        WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') 
        EXECUTE FUNCTION public.rls_auto_enable();

    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
END $$;

SELECT pass('Idempotent migration re-execution completed without errors');

SELECT * FROM finish();

ROLLBACK;
