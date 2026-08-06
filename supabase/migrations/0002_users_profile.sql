-- Migration: 0002_users_profile.sql
-- Description: Creates public.users profile table, enum, auto-provisioning trigger, RLS policies, and privilege escalation controls.
-- Idempotent: Safe to execute on fresh schema following 0001_database_foundation.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'owner');

-- -----------------------------------------------------------------------------
-- 2. TABLES & CONSTRAINTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.users (
    id UUID NOT NULL,
    display_name VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    role public.user_role NOT NULL DEFAULT 'user',
    is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT fk_users_auth_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- Automatically update updated_at on public.users BEFORE UPDATE
CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function: handle_new_user()
-- Automatically creates or updates public.users profile upon auth.users INSERT (Signup / OAuth login).
-- Security: SECURITY DEFINER with search_path = '' to prevent search path hijacking.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, display_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger: on_auth_user_created on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile only
CREATE POLICY users_select_own
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to target their own profile row for updates
CREATE POLICY users_update_own
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 5. PRIVILEGE ESCALATION PREVENTION
-- -----------------------------------------------------------------------------

-- Revoke full update privileges from authenticated role on public.users
REVOKE UPDATE ON public.users FROM authenticated;

-- Grant update privileges ONLY to safe user-editable columns
GRANT UPDATE (display_name, avatar_url) ON public.users TO authenticated;
