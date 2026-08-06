# DB-01 - Database Foundation

## Overview
This document establishes production-ready database standards, extensions, helper functions, and naming conventions for the Supabase project. Every future migration in this repository **must** strictly adhere to the guidelines and standards defined here.

---

## 1. Installed Extensions

The following Postgres extensions are installed in the `0001_database_foundation.sql` migration:

| Extension | Purpose | Notes |
| :--- | :--- | :--- |
| `pgcrypto` | UUID generation via `gen_random_uuid()` and cryptographic functions. | Standard for primary key generation across all tables. |
| `pg_trgm` | Trigram matching for fuzzy string search and similarity indexing. | Used for fuzzy search on domain names, page titles, etc. |
| `unaccent` | Accent-insensitive and case-insensitive search capabilities. | Removes diacritics/accents from text. |

> [!WARNING]
> **CRITICAL GOTCHA: `unaccent()` is STABLE, NOT IMMUTABLE**
> 
> PostgreSQL marks the built-in `unaccent(text)` function as `STABLE` (not `IMMUTABLE`) because its behavior depends on current locale/dictionary settings.
> 
> **Impact on Functional Indexes:**
> PostgreSQL requires expressions used in functional indexes to be strictly `IMMUTABLE`. Attempting to create an index directly like:
> ```sql
> -- THIS WILL FAIL!
> CREATE INDEX idx_pages_title ON public.pages (lower(unaccent(title)));
> ```
> will result in: `ERROR: functions in index expression must be marked IMMUTABLE`.
> 
> **Standard Workaround for Future Migrations:**
> Whenever a future migration requires a functional index using `unaccent`, that migration **must** define an `IMMUTABLE` wrapper function first:
> ```sql
> CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
> RETURNS text AS $$
>   SELECT public.unaccent($1);
> $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
> 
> -- Then create index using the immutable wrapper:
> CREATE INDEX idx_pages_title ON public.pages (lower(public.immutable_unaccent(title)));
> ```
> *Note: Do NOT create this wrapper function in DB-01. Introduce it only in the future migration that requires it.*

---

## 2. Helper Functions & Triggers

### `update_updated_at_column()`
Automatically updates the `updated_at` column to the current timestamp (`now()`) prior to any `UPDATE` operation.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Reusable Trigger Pattern
Every table containing an `updated_at` timestamp column **must** attach this function using a `BEFORE UPDATE` trigger:

```sql
CREATE TRIGGER trg_<table>_set_updated_at
    BEFORE UPDATE ON public.<table>
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 3. Global Conventions & Standards

### Schema & Core Columns
1. **Schema Location**: All application tables must reside in the `public` schema.
2. **Primary Keys**: Every table must use a random UUID primary key:
   ```sql
   id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   ```
3. **Timestamps**: Every table must track standard audit timestamps in UTC (`TIMESTAMPTZ`):
   ```sql
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   ```
4. **Timezone Policy**: Always store timestamps as `TIMESTAMPTZ`. Never use `TIMESTAMP` (without timezone). All values are normalized to UTC.
5. **Soft Deletes**: Tables requiring data recovery capability use:
   ```sql
   deleted_at TIMESTAMPTZ NULL
   ```
   All application queries against soft-deletable tables **must** include `WHERE deleted_at IS NULL`.

### Row Level Security (RLS) Mandate
> [!IMPORTANT]
> **Strict RLS Policy**: Every single table created in future migrations **MUST** have Row Level Security enabled in the **SAME** migration file that creates the table, accompanied by explicit access policies.
> 
> Example mandate template:
> ```sql
> ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
> ```
> No table ships without RLS — zero exceptions allowed.

---

## 4. Database Naming Rules

To maintain absolute consistency across all migrations, enforce the following naming rules:

| Object Type | Case / Format | Example |
| :--- | :--- | :--- |
| **Tables** | `snake_case`, plural | `projects`, `page_links` |
| **Columns** | `snake_case` | `domain_name`, `created_at` |
| **Foreign Keys** | `<table>_id` | `project_id`, `user_id` |
| **Enums** | `snake_case` singular, suffixed by kind | `job_status`, `scan_status` |
| **Indexes** | `idx_<table>_<column>` | `idx_projects_domain_name` |
| **Primary Key Constraints** | `pk_<table>` | `pk_projects` |
| **Foreign Key Constraints** | `fk_<table>_<reference>` | `fk_pages_project` |
| **Unique Constraints** | `uq_<table>_<column(s)>` | `uq_projects_domain` |
| **Check Constraints** | `chk_<table>_<column>` | `chk_scans_score` |
| **Triggers** | `trg_<table>_<action>` | `trg_projects_set_updated_at` |

---

## 5. Migration Constraints & Non-Goals for DB-01
- **No Application Tables**: Zero tables (e.g. `users`, `projects`, `domains`) are created in DB-01.
- **No Enum Types**: Enums are introduced strictly in the future migration that first requires them.
- **No RLS Policies**: RLS rules are documented as a mandate, but no policies are applied in DB-01.
- **No Seed Data**: DB-01 contains strictly schema metadata, extensions, and helper functions.
