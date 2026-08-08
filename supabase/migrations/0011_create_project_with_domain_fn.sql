-- Migration: 0011_create_project_with_domain_fn.sql
-- Description: Creates atomic create_project_with_domain RPC function for project & primary domain provision.
-- Idempotent: Safe to execute on fresh schema following 0010_jobs_audit_reports.sql.

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
