# DB-03 - Projects & Domains

## Overview

This document establishes the architecture, schemas, constraints, partial indexes, and Row Level Security policies for `public.projects` and `public.domains`. Every project is owned by a single user, and every domain belongs to a project with a DB-enforced single primary domain constraint and strict host format validation.

---

## 1. Schema & Relationships

### `public.project_status` Enum

```sql
CREATE TYPE public.project_status AS ENUM ('active', 'archived');
```

---

### `public.projects` Table Definition

| Column        | Type             | Nullable | Default             | Description                         |
| :------------ | :--------------- | :------- | :------------------ | :---------------------------------- |
| `id`          | `UUID`           | **NO**   | `gen_random_uuid()` | Primary Key                         |
| `user_id`     | `UUID`           | **NO**   | _None_              | Foreign Key to `public.users(id)`   |
| `name`        | `VARCHAR(255)`   | **NO**   | _None_              | Project display name                |
| `slug`        | `VARCHAR(255)`   | **NO**   | _None_              | URL-friendly slug (unique per user) |
| `description` | `TEXT`           | YES      | `NULL`              | Project description                 |
| `industry`    | `VARCHAR(100)`   | YES      | `NULL`              | Business industry classification    |
| `status`      | `project_status` | **NO**   | `'active'`          | Project lifecycle status            |
| `created_at`  | `TIMESTAMPTZ`    | **NO**   | `now()`             | Record creation timestamp (UTC)     |
| `updated_at`  | `TIMESTAMPTZ`    | **NO**   | `now()`             | Record modification timestamp (UTC) |
| `deleted_at`  | `TIMESTAMPTZ`    | YES      | `NULL`              | Soft deletion timestamp             |

#### Key Constraints & Indexes

- **Primary Key Constraint**: `CONSTRAINT pk_projects PRIMARY KEY (id)`
- **Foreign Key Constraint**: `CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE`
- **Unique Constraint**: `CONSTRAINT uq_projects_user_slug UNIQUE (user_id, slug)`
- **Indexes**:
  - `idx_projects_user_id ON public.projects(user_id)`
  - `idx_projects_status ON public.projects(status)`

---

### `public.domains` Table Definition

| Column                | Type           | Nullable | Default             | Description                                      |
| :-------------------- | :------------- | :------- | :------------------ | :----------------------------------------------- |
| `id`                  | `UUID`         | **NO**   | `gen_random_uuid()` | Primary Key                                      |
| `project_id`          | `UUID`         | **NO**   | _None_              | Foreign Key to `public.projects(id)`             |
| `host`                | `VARCHAR(255)` | **NO**   | _None_              | Normalized hostname (lowercase, no scheme/slash) |
| `scheme`              | `VARCHAR(10)`  | **NO**   | `'https'`           | Connection scheme (`http` or `https`)            |
| `is_primary`          | `BOOLEAN`      | **NO**   | `TRUE`              | Single primary domain flag per project           |
| `is_verified`         | `BOOLEAN`      | **NO**   | `FALSE`             | Domain ownership verification flag               |
| `verification_method` | `VARCHAR(50)`  | YES      | `NULL`              | Verification method (e.g. `dns_txt`, `meta_tag`) |
| `verification_token`  | `TEXT`         | YES      | `NULL`              | Verification token string                        |
| `created_at`          | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record creation timestamp (UTC)                  |
| `updated_at`          | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record modification timestamp (UTC)              |
| `deleted_at`          | `TIMESTAMPTZ`  | YES      | `NULL`              | Soft deletion timestamp                          |

#### Key Constraints & Indexes

- **Primary Key Constraint**: `CONSTRAINT pk_domains PRIMARY KEY (id)`
- **Foreign Key Constraint**: `CONSTRAINT fk_domains_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE`
- **Unique Host Constraint**: `CONSTRAINT uq_domains_project_host UNIQUE (project_id, host)`
- **Scheme Check Constraint**: `CONSTRAINT chk_domains_scheme CHECK (scheme IN ('http', 'https'))`
- **Host Format Check Constraint**: `CONSTRAINT chk_domains_host_format CHECK (host = lower(host) AND host !~ '^https?://' AND host NOT LIKE '%/')`
- **Indexes**:
  - `idx_domains_project_id ON public.domains(project_id)`
  - `idx_domains_host ON public.domains(host)`

---

## 2. DB-Enforced Business Rules

### Single Primary Domain Partial Unique Index

To guarantee that a project has at most one primary domain, a partial unique index is enforced at the database level:

```sql
CREATE UNIQUE INDEX uq_domains_project_primary
    ON public.domains(project_id)
    WHERE is_primary = TRUE;
```

> [!IMPORTANT]
> **Why DB Enforcement?**
> Relying solely on application logic to ensure only one domain has `is_primary = TRUE` introduces race conditions during concurrent updates. The partial unique index `uq_domains_project_primary` guarantees that PostgreSQL will reject any transaction attempting to insert or update a second domain with `is_primary = TRUE` for the same `project_id`.

### Normalized Hostname CHECK Constraint

```sql
CONSTRAINT chk_domains_host_format CHECK (
    host = lower(host)
    AND host !~ '^https?://'
    AND host NOT LIKE '%/'
)
```

> [!WARNING]
> **Host Formatting Requirement**:
> Hostnames must be strictly normalized prior to insertion.
>
> - **Allowed**: `example.com`, `sub.domain.co.uk`
> - **Rejected**: `HTTPS://EXAMPLE.COM`, `example.com/`, `https://example.com`

---

## 3. Row Level Security & Soft Delete Architecture

### Projects RLS Policies

```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_own ON public.projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY projects_insert_own ON public.projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY projects_update_own ON public.projects FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### Domains RLS Policies (EXISTS Subquery Join)

Because `public.domains` does not contain a `user_id` column, RLS policies determine ownership by joining through `public.projects` using `EXISTS`:

```sql
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY domains_select_own ON public.domains FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));

CREATE POLICY domains_insert_own ON public.domains FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));

CREATE POLICY domains_update_own ON public.domains FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = domains.project_id AND p.user_id = auth.uid()));
```

### No-Hard-Delete Policy Rule

> [!NOTE]
> **Soft Delete Security Pattern**:
> Neither `public.projects` nor `public.domains` has a `DELETE` policy defined.
>
> - Direct SQL `DELETE` queries executed by client roles (`authenticated`, `anon`) will affect 0 rows.
> - To delete a project or domain, applications must perform a soft delete:
>   ```sql
>   UPDATE public.projects SET deleted_at = now() WHERE id = :project_id;
>   ```
> - Soft delete updates are governed securely under `projects_update_own` and `domains_update_own`.
