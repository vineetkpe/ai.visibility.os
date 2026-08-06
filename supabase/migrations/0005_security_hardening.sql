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
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;

CREATE EVENT TRIGGER ensure_rls 
    ON ddl_command_end 
    WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') 
    EXECUTE FUNCTION public.rls_auto_enable();

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
