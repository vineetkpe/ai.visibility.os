# DB-04b - Security Hardening (pre-DB-05)

## Overview
This document specifies the database security hardening changes introduced in `0005_security_hardening.sql`. Prior to proceeding with DB-05, all 4 actionable findings from the Supabase database linter have been resolved, and live untracked database event triggers have been formalized into version-controlled migrations.

---

## 1. Fix Mutable `search_path` on `update_updated_at_column()`

### Problem
The standard trigger function `public.update_updated_at_column()` was created without an explicit `search_path` configuration. In PostgreSQL PL/pgSQL functions, omitting `search_path` allows the caller's session search path to dictate schema resolution, creating security risks (search path hijacking).

### Solution
Re-create `public.update_updated_at_column()` with `SET search_path = ''` specified. Since the function body only manipulates `NEW.updated_at` and calls `now()`, empty search path resolution is safe and completely isolated.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 2. Extension Schema Relocation (`extensions` Schema)

### Problem
Postgres extensions `pg_trgm` and `unaccent` were originally installed directly into the `public` schema. Installing extensions in `public` can contaminate the public namespace and expose internal extension functions via Supabase PostgREST APIs.

### Solution
1. Create a dedicated `extensions` schema: `CREATE SCHEMA IF NOT EXISTS extensions;`
2. Relocate `pg_trgm` and `unaccent` from `public` to `extensions` using guarded SQL blocks.

```sql
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
```

> [!NOTE]
> `pgcrypto` is untouched as it is already installed outside the `public` schema by default in Supabase projects.

---

## 3. Revoke Unrestricted RPC Execution on `handle_new_user()`

### Problem
The auth trigger function `public.handle_new_user()` was callable via PostgREST RPC endpoints by default because Postgres grants `EXECUTE` privilege to `PUBLIC` on newly created functions. While direct RPC calls would fail due to missing trigger contexts, Supabase linter flags exposed trigger functions.

### Solution
Explicitly revoke `EXECUTE` privileges on `public.handle_new_user()` from `PUBLIC`, `anon`, and `authenticated` roles.

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

---

## 4. Formalize Untracked `rls_auto_enable()` & `ensure_rls` Event Trigger

### Problem & Background
The function `public.rls_auto_enable()` and its accompanying DDL event trigger `ensure_rls` were running live in the Supabase database instance to ensure any newly created table automatically gets `ROW LEVEL SECURITY` enabled. However, these database objects were never captured in any migration file in `supabase/migrations/`. 

If this repository were restored or deployed to a fresh environment from migration files alone, this automatic security net would silently fail to exist.

### Solution
1. Reproduce `public.rls_auto_enable()` function logic exactly as currently live.
2. Re-create the `ensure_rls` event trigger on DDL end events (`CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`).
3. Revoke direct `EXECUTE` privileges on `rls_auto_enable()` to prevent exposed RPC access.

```sql
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
```

---

## 5. Verification & Testing

The security hardening migration is accompanied by a dedicated test suite (`supabase/tests/0005_security_hardening.sql`) verifying:
1. `update_updated_at_column` contains a non-empty `proconfig` with `search_path`.
2. `pg_trgm` and `unaccent` reside in `extensions` schema.
3. `has_function` returns true for updated functions.
4. `has_function_privilege` returns `false` for `anon` and `authenticated` roles on `handle_new_user` and `rls_auto_enable`.
5. Event trigger `ensure_rls` exists and is enabled (`evtenabled = 'O'`).
6. A temporary throwaway table automatically receives `relrowsecurity = true` upon creation.
7. The entire migration is fully idempotent and safe to re-execute.
