-- Migration: 0005_security_hardening.sql
-- Description: Security hardening pre-DB-05 resolving Supabase linter findings and formalizing untracked event triggers.
-- Idempotent: Safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. FIX MUTABLE SEARCH_PATH ON update_updated_at_column
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. MOVE EXTENSIONS TO DEDICATED EXTENSIONS SCHEMA
-- -----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$ 
BEGIN 
    IF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'pg_trgm') = 'public' THEN 
        ALTER EXTENSION pg_trgm SET SCHEMA extensions; 
    END IF; 
END $$;

DO $$ 
BEGIN 
    IF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'unaccent') = 'public' THEN 
        ALTER EXTENSION unaccent SET SCHEMA extensions; 
    END IF; 
END $$;

-- -----------------------------------------------------------------------------
-- 3. REVOKE UNRESTRICTED EXECUTE ON TRIGGER FUNCTIONS
-- -----------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. FORMALIZE UNTRACKED rls_auto_enable FUNCTION & EVENT TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
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
$$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;

CREATE EVENT TRIGGER ensure_rls 
    ON ddl_command_end 
    WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') 
    EXECUTE FUNCTION public.rls_auto_enable();

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
