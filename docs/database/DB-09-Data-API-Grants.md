# DB-09 - Data API Explicit Privileges & Schema Access Grants

## Overview

This document details the PostgreSQL Data API privilege configuration established in migration `0012_data_api_grants.sql`.

It documents why explicit `GRANT` statements are required following Supabase 2026 security updates, how table-level privileges strictly align with existing Row Level Security (RLS) policies, and why the `anon` role is intentionally denied all data access.

---

## 1. Context & Architectural Rationale

### A. Supabase 2026 Data API Default Behavior Change

- **Background**: Historically, PostgREST and Supabase default role setups granted implicit table privileges to public roles, relying solely on Row Level Security (RLS) to enforce data boundaries.
- **2026 Security Change**: Supabase introduced a strict default posture requiring explicit table-level and schema-level `GRANT` statements before PostgREST will surface an API endpoint via `supabase-js`. RLS policies continue to govern row-by-row filtering, but table-level reachability now requires explicit SQL privileges (`GRANT SELECT, INSERT, UPDATE, DELETE`).
- **One-Time Catch-Up**: Migration `0012_data_api_grants.sql` provides a explicit catch-up across all 25 tables created in migrations 0002-0010 and the RPC function created in migration 0011.

### B. Privilege Alignment Principles

- **Strict Policy Matching**: Table grants match, and do not exceed, the specific operations allowed by each table's RLS policies (`projects_select_own`, `projects_insert_own`, etc.).
- **DELETE Privilege Scope**: Only `public.competitors` and `public.reports` are granted `DELETE`. All other 23 tables intentionally omit `DELETE` grants because hard deletions are forbidden by application architecture (favoring soft deletion via `deleted_at` timestamps or append-only audit trails).
- **Anon Denial**: `anon` role is granted zero schema usage or table privileges. AI Visibility OS has no unauthenticated data access — every table check is scoped via `auth.uid()`.

---

## 2. Table Grant Mapping Matrix

| Migration | Table Name                  | `authenticated` Privileges             | `anon` Privileges | RLS Alignment Rationale                       |
| --------- | --------------------------- | -------------------------------------- | ----------------- | --------------------------------------------- |
| `0002`    | `users`                     | `SELECT`, `UPDATE`                     | _None_            | Profile view & update own display_name/avatar |
| `0003`    | `projects`                  | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Workspace creation, update & soft delete      |
| `0003`    | `domains`                   | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Primary domain management                     |
| `0004`    | `crawl_sessions`            | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Crawl pipeline execution                      |
| `0004`    | `pages`                     | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Discovered page indexing                      |
| `0004`    | `page_metadata`             | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Page metadata extraction                      |
| `0004`    | `robots_files`              | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Robots.txt cache                              |
| `0004`    | `sitemaps`                  | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Sitemap index tracking                        |
| `0004`    | `crawl_errors`              | `SELECT`, `INSERT`                     | _None_            | Append-only error logging                     |
| `0007`    | `business_context_versions` | `SELECT`, `INSERT`                     | _None_            | Context version snapshots                     |
| `0007`    | `entities`                  | `SELECT`, `INSERT`                     | _None_            | Entity extraction records                     |
| `0007`    | `topics`                    | `SELECT`, `INSERT`                     | _None_            | Content topic mapping                         |
| `0007`    | `products`                  | `SELECT`, `INSERT`                     | _None_            | Product catalog context                       |
| `0007`    | `services`                  | `SELECT`, `INSERT`                     | _None_            | Service catalog context                       |
| `0007`    | `technologies`              | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Tech stack detection                          |
| `0008`    | `providers`                 | `SELECT`                               | _None_            | Read-only AI model registry                   |
| `0008`    | `prompt_library`            | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Visibility prompt templates                   |
| `0008`    | `ai_scans`                  | `SELECT`, `INSERT`, `UPDATE`           | _None_            | AI scan execution                             |
| `0008`    | `citations`                 | `SELECT`, `INSERT`                     | _None_            | LLM citation evidence                         |
| `0009`    | `competitors`               | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | _None_            | Competitor tracking (supports DELETE RLS)     |
| `0009`    | `recommendations`           | `SELECT`, `INSERT`, `UPDATE`           | _None_            | SEO & GEO recommendations                     |
| `0009`    | `recommendation_evidence`   | `SELECT`, `INSERT`                     | _None_            | Recommendation proof points                   |
| `0010`    | `jobs`                      | `SELECT`, `INSERT`, `UPDATE`           | _None_            | Async background job queue                    |
| `0010`    | `audit_logs`                | `SELECT`, `INSERT`                     | _None_            | Immutable security audit log                  |
| `0010`    | `reports`                   | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | _None_            | Report exports (supports DELETE RLS)          |

---

## 3. Function Grants & PostgREST Reload

```sql
GRANT EXECUTE ON FUNCTION public.create_project_with_domain(TEXT, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
```

---

## 4. Permanent Project Standard

Every future migration in this repository that creates a table or function MUST include its own explicit `GRANT` statements:

1. `GRANT <PRIVILEGES> ON public.<new_table> TO authenticated;` matching its RLS policies.
2. `GRANT EXECUTE ON FUNCTION public.<new_function>(...) TO authenticated;` if client-callable.
3. Do NOT grant privileges to `anon` unless logged-out access is explicitly required by design.
