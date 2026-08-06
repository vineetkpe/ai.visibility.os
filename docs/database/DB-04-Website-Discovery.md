# DB-04 - Website Discovery Engine

## Overview
This document establishes the database architecture, schema, constraints, composite foreign keys, RLS ownership chains, and security rules for the Website Discovery Engine in AI Visibility OS. The discovery engine manages crawl sessions, canonical pages, metadata, robots.txt directives, sitemaps, and append-only crawl error logs.

---

## 1. Schema & Relationships

### Prerequisite Composite Unique Constraint
To prevent project/domain mismatches on discovered pages, `public.domains` enforces a composite unique key:

```sql
ALTER TABLE public.domains ADD CONSTRAINT uq_domains_id_project UNIQUE (id, project_id);
```

### `public.crawl_status` Enum
```sql
CREATE TYPE public.crawl_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
```

---

## 2. Table Definitions

### A. `public.crawl_sessions`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Foreign Key to `public.projects(id)` |
| `status` | `crawl_status` | **NO** | `'queued'` | Session lifecycle status |
| `started_at` | `TIMESTAMPTZ` | **NO** | `now()` | Crawl start timestamp |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Crawl completion timestamp |
| `pages_discovered` | `INTEGER` | **NO** | `0` | Snapshot summary counter |
| `pages_crawled` | `INTEGER` | **NO** | `0` | Snapshot summary counter |
| `error_count` | `INTEGER` | **NO** | `0` | Snapshot summary counter |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

> [!WARNING]
> **Summary Counter Staleness Risk**:
> `pages_discovered`, `pages_crawled`, and `error_count` are snapshot summary counters updated by crawler job state transitions, **not** live-derived subqueries. If a crawler worker crashes or omits updating these fields, the values will become stale relative to the actual `pages` or `crawl_errors` tables.

---

### B. `public.pages`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Composite Foreign Key component |
| `domain_id` | `UUID` | **NO** | *None* | Composite Foreign Key component |
| `url` | `TEXT` | **NO** | *None* | Full target URL |
| `path` | `TEXT` | **NO** | *None* | URL path component |
| `status_code` | `INTEGER` | YES | `NULL` | HTTP response code (100–599) |
| `content_type` | `VARCHAR(100)` | YES | `NULL` | Response MIME content-type |
| `last_crawled_at` | `TIMESTAMPTZ` | YES | `NULL` | Last successful crawl timestamp |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

> [!IMPORTANT]
> **Composite Foreign Key Protection**:
> `CONSTRAINT fk_pages_domain_project FOREIGN KEY (domain_id, project_id) REFERENCES public.domains(id, project_id) ON DELETE CASCADE`
> This composite foreign key guarantees at the database level that a page's `domain_id` and `project_id` must match the domain's actual owning project. It is physically impossible to insert a page record linking a domain from Project A to Project B.

---

### C. `public.page_metadata`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `page_id` | `UUID` | **NO** | *None* | Foreign Key to `public.pages(id)` (1:1) |
| `title` | `TEXT` | YES | `NULL` | HTML `<title>` tag content |
| `meta_description` | `TEXT` | YES | `NULL` | Meta description tag content |
| `canonical_url` | `TEXT` | YES | `NULL` | Declared canonical URL |
| `language` | `VARCHAR(20)` | YES | `NULL` | Document language attribute |
| `schema_json` | `JSONB` | YES | `NULL` | Parsed JSON-LD schema markup |
| `open_graph` | `JSONB` | YES | `NULL` | Parsed OpenGraph metadata |
| `twitter_cards` | `JSONB` | YES | `NULL` | Parsed Twitter card metadata |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

---

### D. `public.robots_files`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `domain_id` | `UUID` | **NO** | *None* | Foreign Key to `public.domains(id)` (1:1) |
| `raw_content` | `TEXT` | YES | `NULL` | Raw `robots.txt` file contents |
| `is_accessible` | `BOOLEAN` | **NO** | `TRUE` | Whether `robots.txt` was accessible |
| `fetched_at` | `TIMESTAMPTZ` | **NO** | `now()` | Last fetch timestamp |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

*Note: Updated in place upon refetch (not historical).*

---

### E. `public.sitemaps`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `domain_id` | `UUID` | **NO** | *None* | Foreign Key to `public.domains(id)` |
| `url` | `TEXT` | **NO** | *None* | Full sitemap URL |
| `url_count` | `INTEGER` | YES | `NULL` | Number of URLs declared in sitemap |
| `last_fetched_at` | `TIMESTAMPTZ` | YES | `NULL` | Last fetch timestamp |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

---

### F. `public.crawl_errors` (Append-Only Log)

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `crawl_session_id` | `UUID` | **NO** | *None* | Foreign Key to `public.crawl_sessions(id)` |
| `page_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `public.pages(id)` |
| `url` | `TEXT` | **NO** | *None* | Target URL where error occurred |
| `error_type` | `VARCHAR(50)` | **NO** | *None* | Free-text error classification |
| `error_message` | `TEXT` | YES | `NULL` | Detailed error description |
| `http_status_code` | `INTEGER` | YES | `NULL` | HTTP status code if available |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |

> [!NOTE]
> **Free-Text `error_type` Design**:
> `error_type` is intentionally stored as a free-text `VARCHAR(50)` rather than a static ENUM. Crawler failure modes (e.g. `DNS_TIMEOUT`, `SSRF_BLOCKED`, `PARSER_FAIL`, `TOO_MANY_REDIRECTS`) will expand faster than database ENUM types should be modified.
> 
> **Append-Only Nature**:
> `crawl_errors` deliberately omits an `updated_at` column and trigger. Errors represent historical audit events and are never modified after creation.

---

## 3. RLS Policies & Ownership Chains

All 6 discovery tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

| Table | Ownership Policy Chain |
| :--- | :--- |
| `crawl_sessions` | Directly joins `public.projects` via `project_id = p.id AND p.user_id = auth.uid()` |
| `pages` | Directly joins `public.projects` via `project_id = p.id AND p.user_id = auth.uid()` |
| `page_metadata` | Transitively joins `pages.project_id` to `public.projects` |
| `robots_files` | Transitively joins `domains.project_id` to `public.projects` |
| `sitemaps` | Transitively joins `domains.project_id` to `public.projects` |
| `crawl_errors` | Transitively joins `crawl_sessions.project_id` to `public.projects` |

> [!CAUTION]
> **No-Delete Policy Enforced**:
> No table in DB-04 contains a `DELETE` RLS policy for client roles (`authenticated`, `anon`). Direct SQL `DELETE` queries executed by client applications will be blocked (affecting 0 rows). Deletions occur automatically via `ON DELETE CASCADE` if a parent project is removed by system-level administration.
