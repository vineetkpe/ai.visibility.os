# DB-09 - Atomic Project & Primary Domain Provisioning

## Overview
This document details the architecture, transaction mechanics, security scope, and error handling for the atomic project creation PostgreSQL function `public.create_project_with_domain()`.

---

## 1. Architecture & Design Principles

### A. Atomicity & Orphan Prevention
- **Problem**: Previously, project creation involved two separate client/server action DML calls (`INSERT INTO projects` followed by `INSERT INTO domains`). If domain creation failed (due to format constraints, unique violations, or network interruptions), the application attempted a manual compensation deletion (`DELETE FROM projects WHERE id = project.id`). If that cleanup failed or was interrupted, an orphaned project row was permanently left behind in the database without a primary domain.
- **Solution**: `create_project_with_domain()` encapsulates project creation and primary domain assignment within a single PostgreSQL function body. Because PostgreSQL executes function bodies within a single implicit transaction, any constraint violation during domain insertion (such as `chk_domains_host_format` or `uq_domains_project_host`) causes an automatic database rollback of the entire operation, guaranteeing that no orphaned project record is ever created.

### B. Security Authorization Scope (`SECURITY INVOKER`)
- **Security Pattern**: Declared as `SECURITY INVOKER SET search_path = ''`.
- **Rationale**:
  - Running as `SECURITY INVOKER` ensures the function executes with the privileges and RLS context of the calling user (`authenticated` role).
  - `auth.uid()` resolves correctly to the session user's UUID.
  - Standard RLS policies (`projects_insert_own` and `domains_insert_own`) remain fully enforced during function execution.
  - `SET search_path = ''` prevents search path hijacking attacks by requiring explicit schema qualification (`public.projects`, `public.domains`).

---

## 2. Function Signature & Definition

```sql
CREATE OR REPLACE FUNCTION public.create_project_with_domain(p_name TEXT, p_host TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_project_id UUID;
    v_slug TEXT;
    v_base_slug TEXT;
    v_count INT := 1;
BEGIN
    -- Normalize slug from project name
    v_base_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_base_slug := trim(both '-' from v_base_slug);
    IF v_base_slug IS NULL OR v_base_slug = '' THEN
        v_base_slug := 'project';
    END IF;

    v_slug := v_base_slug;

    -- Ensure slug uniqueness for this user
    WHILE EXISTS (SELECT 1 FROM public.projects WHERE user_id = auth.uid() AND slug = v_slug) LOOP
        v_count := v_count + 1;
        v_slug := v_base_slug || '-' || v_count;
    END LOOP;

    -- Atomic insertion: Projects row + Primary domain row
    INSERT INTO public.projects (user_id, name, slug)
    VALUES (auth.uid(), trim(p_name), v_slug)
    RETURNING id INTO v_project_id;

    INSERT INTO public.domains (project_id, host, is_primary)
    VALUES (v_project_id, p_host, TRUE);

    RETURN v_project_id;
END;
$$;
```

---

## 3. Test Coverage Summary (`0011_create_project_with_domain_fn.sql`)

The pgTAP test suite validates:
1. Function existence in `public` schema.
2. Successful execution under an `authenticated` user context.
3. Verification that `domains.host` matches input and `is_primary` is `TRUE`.
4. Rejection of invalid host formats by `chk_domains_host_format`.
5. Automatic rollback verification (confirming zero orphaned rows in `public.projects` after constraint rejection).
6. Row Level Security isolation across user sessions.
