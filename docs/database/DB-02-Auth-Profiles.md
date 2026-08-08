# DB-02 - Authentication & User Profiles

## Overview

This document establishes the architecture, schema, auto-provisioning triggers, and security controls for `public.users`. The profile table maintains a strict 1:1 relationship with Supabase's internal `auth.users` table, following all conventions defined in `DB-01-Foundation.md`.

---

## 1. Schema & Relationships

### `public.user_role` Enum

```sql
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'owner');
```

### `public.users` Table Definition

| Column          | Type           | Nullable | Default  | Description                                   |
| :-------------- | :------------- | :------- | :------- | :-------------------------------------------- |
| `id`            | `UUID`         | **NO**   | _None_   | Primary Key & Foreign Key to `auth.users(id)` |
| `display_name`  | `VARCHAR(255)` | YES      | `NULL`   | User's full name or display name              |
| `avatar_url`    | `TEXT`         | YES      | `NULL`   | Profile avatar image URL                      |
| `role`          | `user_role`    | **NO**   | `'user'` | Application role (`user`, `admin`, `owner`)   |
| `is_onboarded`  | `BOOLEAN`      | **NO**   | `FALSE`  | Onboarding flow completion status             |
| `last_login_at` | `TIMESTAMPTZ`  | YES      | `NULL`   | Timestamp of last user sign-in                |
| `created_at`    | `TIMESTAMPTZ`  | **NO**   | `now()`  | Record creation timestamp (UTC)               |
| `updated_at`    | `TIMESTAMPTZ`  | **NO**   | `now()`  | Record modification timestamp (UTC)           |

### Key Constraints

- **Primary Key Constraint**: `CONSTRAINT pk_users PRIMARY KEY (id)`
- **Foreign Key Constraint**: `CONSTRAINT fk_users_auth_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`

---

## 2. Key Architecture Trade-offs & Responsibilities

### No-Email Column Design Trade-off

`auth.users` serves as the **single source of truth** for user email addresses, email confirmations, and authentication credentials. `public.users` deliberately omits an `email` column to eliminate data duplication and out-of-sync states.

> [!NOTE]
> **Known Architectural Trade-off:**
> `auth.users` is inaccessible to client roles (`authenticated` and `anon`). Consequently, client-side queries cannot search, filter, or list users by email address directly via Supabase client DML.
>
> _Future mitigation strategy_: If administrative user search by email is required in a future release, it must be implemented via a trusted Server Action using server-side credentials or a secure RPC function.

### `last_login_at` App-Level Write Responsibility

PostgreSQL database triggers execute on DML events (`INSERT`, `UPDATE`, `DELETE`). Supabase Auth sign-ins generate session tokens at the service level and do **not** fire database DML on `auth.users`.

> [!IMPORTANT]
> **Application Responsibility**:
> `last_login_at` is initialized as `NULL`. An application-level Server Action must issue an `UPDATE public.users SET last_login_at = now() WHERE id = auth.uid()` upon every successful login, or the value will remain `NULL`.

---

## 3. Auto-Provisioning & OAuth Handling (`handle_new_user`)

Profile rows are automatically created upon signup via an `AFTER INSERT` trigger on `auth.users`.

```sql
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

> [!WARNING]
> **SECURITY DEFINER & Search Path Hardening**:
> The `handle_new_user()` function is declared with `SECURITY DEFINER SET search_path = ''`.
> Without clearing the `search_path`, malicious users could manipulate the schema search path to execute arbitrary code with superuser privileges. All table references inside the function body are explicitly schema-qualified (`public.users`).

---

## 4. Row Level Security & Privilege Escalation Controls

### RLS Policies

RLS is enabled on `public.users`.

- `users_select_own`: `SELECT` allowed only when `auth.uid() = id`.
- `users_update_own`: `UPDATE` allowed only when `auth.uid() = id`.

> [!NOTE]
> **Absence of INSERT / DELETE Policies**:
>
> - **No Direct INSERT Policy**: Profiles are created exclusively by the `SECURITY DEFINER` trigger, bypassing RLS. Direct client `INSERT` requests are rejected.
> - **No Direct DELETE Policy**: Profile deletion is handled automatically via `ON DELETE CASCADE` when the corresponding `auth.users` record is removed.

### Privilege Escalation Fix

Standard RLS `UPDATE` policies restrict _which row_ a user can update, but do _not_ restrict _which columns_ can be modified. Without column-level permissions, an attacker could send a payload updating `role = 'admin'` or `is_onboarded = true`.

To completely prevent privilege escalation, column-level `GRANT` permissions are applied:

```sql
-- Revoke generic UPDATE permission from authenticated users
REVOKE UPDATE ON public.users FROM authenticated;

-- Explicitly GRANT UPDATE ONLY on user-editable profile fields
GRANT UPDATE (display_name, avatar_url) ON public.users TO authenticated;
```

This guarantees that:

- `role`, `is_onboarded`, and `last_login_at` can **never** be updated by an authenticated user via client APIs.
- Updates to sensitive fields must be performed through trusted server-side code or dedicated administrative endpoints.
