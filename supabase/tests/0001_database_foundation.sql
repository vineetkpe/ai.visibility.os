-- Test Suite: 0001_database_foundation.sql
-- Description: Verifies DB-01 Foundation extensions, helper functions, UUID generation, and idempotency.

BEGIN;

-- Enable pgTAP testing framework extension
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(6);

-- 1. Extension Verification
SELECT has_extension('pgcrypto', 'pgcrypto extension must be installed');
SELECT has_extension('pg_trgm', 'pg_trgm extension must be installed');
SELECT has_extension('unaccent', 'unaccent extension must be installed');

-- 2. Helper Function Verification
SELECT has_function('update_updated_at_column', 'update_updated_at_column function must exist');

-- 3. UUID Generation Verification
SELECT is(
    (SELECT (gen_random_uuid() IS NOT NULL AND length(gen_random_uuid()::text) = 36)),
    true,
    'gen_random_uuid() must return a valid 36-character UUID string'
);

-- 4. Idempotency Verification (confirm re-running migration statements is safe)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
END $$;

SELECT pass('Idempotent migration re-execution completed without errors');

SELECT * FROM finish();

ROLLBACK;
