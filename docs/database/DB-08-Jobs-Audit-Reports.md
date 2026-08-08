# DB-08 - Jobs, Audit Logs & Reports

## Overview

This document establishes the database architecture, schema, constraints, RLS policies, and design decisions for **Generic Job Tracking (`jobs`)**, **Immutable Audit Logging (`audit_logs`)**, and **Report Artifact Tracking (`reports`)** in AI Visibility OS.

It details how task retry status is surfaced for UI visibility without duplicating orchestration logic, how audit trail integrity is preserved independently of entity lifecycles, and why billing accounts remain intentionally deferred in this schema iteration.

---

## 1. Architectural Principles & Key Design Decisions

### A. Billing Accounts & Subscriptions Deferral

- **Architectural Boundary**: `billing_accounts` and `subscriptions` tables are deliberately deferred from this database migration.
- **Rationale**: Webhook ingestion routines (e.g. Stripe webhook handlers) and service-role sync workflows require explicit architecture alignment on tenant provisioning and payment state transitions. Deferring billing schema prevents schema churn and security policy conflicts prior to finalizing the billing integration module.

### B. Retry Visibility vs. Orchestration Logic (`jobs.retry_count`)

- **UI Visibility Columns**: `jobs` includes `retry_count INTEGER NOT NULL DEFAULT 0` and `max_retries INTEGER NOT NULL DEFAULT 3`, constrained by `chk_jobs_retry_bounds CHECK (retry_count >= 0 AND retry_count <= max_retries)`.
- **Decoupled Orchestration**: These columns provide real-time status visibility to frontend users without requiring background API queries to external orchestrators. Actual task retries, backoffs, and execution policies are managed directly within Trigger.dev task code (e.g. site crawling configured with 2 attempts and exponential backoff; Gemini LLM calls configured with 1 attempt each).

### C. Polymorphic Resource References (`resource_type` / `resource_id`)

- **Loose References**: Both `jobs` and `audit_logs` utilize `resource_type VARCHAR(50) NULL` and `resource_id UUID NULL`.
- **Design Pattern**: This loose polymorphic pattern matches `crawl_errors.error_type` from DB-04, allowing arbitrary platform resources (e.g. `domain`, `scan`, `report`, `project`) to be audited or tracked by background workers without introducing fragile polymorphic foreign keys.

### D. Audit Log Immutability & Lifecycle Outlive

- **Append-Only Trail**: `public.audit_logs` records security and administrative actions. It omits `updated_at` and possesses no `UPDATE` or `DELETE` RLS policies.
- **FK Deletion Retention (`ON DELETE SET NULL`)**: Both `project_id` and `actor_user_id` reference their respective parent tables (`projects`, `users`) with `ON DELETE SET NULL`. This ensures that even if a user deletes their account or project, historical audit entries remain intact for compliance and security forensics.
- **Write Authorization**: RLS `WITH CHECK` enforces that client-initiated audit writes specify `actor_user_id = auth.uid()` and a `project_id` owned by the authenticated session.

### E. Report Artifact Tracking (`reports`)

- **Typed Format vs. Free-Text Type**:
  - `file_format`: Defined as enum `public.report_file_format AS ENUM ('pdf', 'html', 'json')` to enforce export format safety.
  - `report_type`: Kept as `VARCHAR(100)` to allow future expansion of report templates (e.g. `visibility_summary`, `competitor_analysis`, `technical_audit`) without schema migrations.
- **Scan Traceability (`scan_id`)**: `scan_id` is an optional FK to `public.ai_scans(id)`. Single-scan snapshot reports populate `scan_id`, while historical period reports leave `scan_id` NULL and populate `date_range_start` and `date_range_end`.
- **Hard-DELETE Authorization**: Unlike audit logs or evidence records, `reports` permits `DELETE` operations by project owners because reports represent generated user export artifacts rather than audit-trail evidence.

---

## 2. Enums

### `public.report_status`

```sql
CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');
```

### `public.report_file_format`

```sql
CREATE TYPE public.report_file_format AS ENUM ('pdf', 'html', 'json');
```

> **Reused Enums**: `jobs.status` reuses `public.crawl_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled')` established in DB-04.

---

## 3. Table Definitions

### A. `public.jobs`

| Column           | Type           | Nullable | Default             | Description                                      |
| :--------------- | :------------- | :------- | :------------------ | :----------------------------------------------- |
| `id`             | `UUID`         | **NO**   | `gen_random_uuid()` | Primary Key                                      |
| `project_id`     | `UUID`         | **NO**   | _None_              | Foreign Key to `public.projects(id)` (`CASCADE`) |
| `job_type`       | `VARCHAR(50)`  | **NO**   | _None_              | Job classification slug (e.g., `crawl`, `scan`)  |
| `status`         | `crawl_status` | **NO**   | `'queued'`          | Execution status (reused enum)                   |
| `resource_type`  | `VARCHAR(50)`  | YES      | `NULL`              | Optional target resource type                    |
| `resource_id`    | `UUID`         | YES      | `NULL`              | Optional target resource ID                      |
| `trigger_run_id` | `VARCHAR(255)` | YES      | `NULL`              | External Trigger.dev run ID                      |
| `progress`       | `JSONB`        | YES      | `NULL`              | Progress metadata payload                        |
| `retry_count`    | `INTEGER`      | **NO**   | `0`                 | UI visibility current retry count                |
| `max_retries`    | `INTEGER`      | **NO**   | `3`                 | UI visibility max retries allowed                |
| `error_message`  | `TEXT`         | YES      | `NULL`              | Failure diagnostic log message                   |
| `started_at`     | `TIMESTAMPTZ`  | YES      | `NULL`              | Execution start timestamp                        |
| `completed_at`   | `TIMESTAMPTZ`  | YES      | `NULL`              | Execution completion timestamp                   |
| `created_at`     | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record creation timestamp (UTC)                  |
| `updated_at`     | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record modification timestamp (UTC)              |

### B. `public.audit_logs`

| Column          | Type           | Nullable | Default             | Description                                            |
| :-------------- | :------------- | :------- | :------------------ | :----------------------------------------------------- |
| `id`            | `UUID`         | **NO**   | `gen_random_uuid()` | Primary Key                                            |
| `project_id`    | `UUID`         | YES      | `NULL`              | Foreign Key to `public.projects(id)` (`SET NULL`)      |
| `actor_user_id` | `UUID`         | YES      | `NULL`              | Foreign Key to `public.users(id)` (`SET NULL`)         |
| `action`        | `VARCHAR(100)` | **NO**   | _None_              | Action identifier (e.g., `user.login`, `scan.trigger`) |
| `resource_type` | `VARCHAR(50)`  | YES      | `NULL`              | Target entity type                                     |
| `resource_id`   | `UUID`         | YES      | `NULL`              | Target entity ID                                       |
| `metadata`      | `JSONB`        | YES      | `NULL`              | Contextual payload metadata                            |
| `ip_address`    | `INET`         | YES      | `NULL`              | Client IP address                                      |
| `created_at`    | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record creation timestamp (UTC)                        |

### C. `public.reports`

| Column             | Type                 | Nullable | Default             | Description                                       |
| :----------------- | :------------------- | :------- | :------------------ | :------------------------------------------------ |
| `id`               | `UUID`               | **NO**   | `gen_random_uuid()` | Primary Key                                       |
| `project_id`       | `UUID`               | **NO**   | _None_              | Foreign Key to `public.projects(id)` (`CASCADE`)  |
| `scan_id`          | `UUID`               | YES      | `NULL`              | Foreign Key to `public.ai_scans(id)` (`SET NULL`) |
| `report_type`      | `VARCHAR(100)`       | **NO**   | _None_              | Report type slug (e.g., `visibility_summary`)     |
| `status`           | `report_status`      | **NO**   | `'pending'`         | Report generation state                           |
| `file_format`      | `report_file_format` | **NO**   | `'pdf'`             | Export format enum (`pdf`, `html`, `json`)        |
| `report_version`   | `INTEGER`            | **NO**   | `1`                 | Incrementing report version number                |
| `date_range_start` | `DATE`               | YES      | `NULL`              | Period report start date                          |
| `date_range_end`   | `DATE`               | YES      | `NULL`              | Period report end date                            |
| `file_path`        | `TEXT`               | YES      | `NULL`              | Generated storage file path                       |
| `file_size_bytes`  | `INTEGER`            | YES      | `NULL`              | Storage file size in bytes                        |
| `generated_at`     | `TIMESTAMPTZ`        | YES      | `NULL`              | Completion timestamp                              |
| `error_message`    | `TEXT`               | YES      | `NULL`              | Diagnostic error message                          |
| `created_at`       | `TIMESTAMPTZ`        | **NO**   | `now()`             | Record creation timestamp (UTC)                   |
| `updated_at`       | `TIMESTAMPTZ`        | **NO**   | `now()`             | Record modification timestamp (UTC)               |

---

## 4. Constraints & Indexes

### Check Constraints

- `public.jobs`:
  - `chk_jobs_retry_bounds` (`retry_count >= 0 AND retry_count <= max_retries`)
  - `chk_jobs_max_retries` (`max_retries >= 0`)
- `public.reports`:
  - `chk_reports_date_range` (`date_range_start IS NULL OR date_range_end IS NULL OR date_range_end >= date_range_start`)
  - `chk_reports_file_size` (`file_size_bytes IS NULL OR file_size_bytes >= 0`)
  - `chk_reports_version` (`report_version >= 1`)

### Indexes

- `idx_jobs_project_id ON public.jobs(project_id)`
- `idx_jobs_status ON public.jobs(status)`
- `idx_jobs_type ON public.jobs(job_type)`
- `idx_audit_logs_project_id ON public.audit_logs(project_id)`
- `idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id)`
- `idx_audit_logs_created_at ON public.audit_logs(created_at DESC)`
- `idx_reports_project_id ON public.reports(project_id)`
- `idx_reports_scan_id ON public.reports(scan_id)`
- `idx_reports_status ON public.reports(status)`

---

## 5. Row Level Security Policies

Row Level Security is enabled on `jobs`, `audit_logs`, and `reports`.

| Table        | Permitted Operations                   | Policy Join Chain / Rule                                                                                                                   |
| :----------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `jobs`       | `SELECT`, `INSERT`, `UPDATE`           | `projects.user_id = auth.uid()` (No `DELETE`)                                                                                              |
| `audit_logs` | `SELECT`, `INSERT`                     | `SELECT`: `projects.user_id = auth.uid() OR actor_user_id = auth.uid()`. `INSERT`: `WITH CHECK` matching session `auth.uid()`. (Immutable) |
| `reports`    | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `projects.user_id = auth.uid()`                                                                                                            |

> [!NOTE]
> `audit_logs` is strictly append-only; `UPDATE` and `DELETE` policies are omitted across client roles. `reports` permits `DELETE` by authenticated project owners.
