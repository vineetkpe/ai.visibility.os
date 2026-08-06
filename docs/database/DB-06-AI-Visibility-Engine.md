# DB-06 - AI Visibility Engine (v2)

## Overview
This document establishes the database architecture, schema, constraints, RLS policies, and performance tracking metadata for the **AI Visibility Engine** in AI Visibility OS. 

The AI Visibility Engine manages LLM provider configurations, reusable project prompt libraries, scan execution records (capturing dual response payloads, token metrics, latency, and estimated cost), and extracted web citations.

---

## 1. Architectural Principles & Key Design Decisions

### A. Dual Response Payload Storage (`response_json` vs `raw_response`)
- `response_json` (`JSONB`): Stores the provider's canonical, structured API response payload (e.g., candidate objects, metadata, raw structured JSON).
- `raw_response` (`TEXT`): Stores the plain-text/verbatim response string. This acts as a fallback for providers or pipeline steps that only yield unformatted prose text. Both fields can be populated independently.

### B. Mention Position vs. Citation Rank
- **`mention_position` (`INTEGER`)**: Stored on `public.ai_scans`. Represents the **character offset** in `raw_response` where the target business or brand is first named in prose (or `NULL` if unmentioned). It is **not** a citation rank or search result position.
- **Citation Rank**: Citation rank is **not** stored as a redundant column on `ai_scans`. It is computed dynamically via a query against `public.citations`:
  ```sql
  SELECT position FROM public.citations
  WHERE ai_scan_id = :scan_id
    AND is_own_domain = TRUE
  ORDER BY position ASC
  LIMIT 1;
  ```
- **Performance Optimization**: Partial index `idx_citations_own_domain` (`WHERE is_own_domain = TRUE`) ensures citation rank queries execute with sub-millisecond efficiency.

### C. Prompt Library Snapshots
- `public.ai_scans` maintains a dedicated `prompt_text` column.
- **Snapshot Behavior**: At scan creation time, `prompt_text` is copied directly into `ai_scans`. Subsequent edits or deletions of prompt templates in `public.prompt_library` leave historical scan prompt snapshots completely untouched.

### D. Provider Deletion Protection (`ON DELETE RESTRICT`)
- `ai_scans.provider_id` references `public.providers(id)` with `ON DELETE RESTRICT`.
- **Rationale**: Prevents accidental deletion of provider catalog entries that would break historical scan analytics and cost/performance logs.

---

## 2. Enums

### `public.scan_status`
```sql
CREATE TYPE public.scan_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
```

### `public.sentiment_type`
```sql
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'neutral', 'negative');
```

---

## 3. Table Definitions

### A. `public.providers`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `slug` | `VARCHAR(50)` | **NO** | *None* | Unique provider identifier slug |
| `display_name` | `VARCHAR(100)` | **NO** | *None* | Human-readable provider name |
| `is_active` | `BOOLEAN` | **NO** | `FALSE` | Provider activation flag |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

> **Seed Data**: `gemini` is active (`TRUE`) by default; `chatgpt`, `perplexity`, `claude`, `deepseek`, and `grok` are seeded as inactive (`FALSE`).

### B. `public.prompt_library`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Foreign Key to `public.projects(id)` |
| `prompt_text` | `TEXT` | **NO** | *None* | Reusable prompt template text |
| `category` | `VARCHAR(100)` | YES | `NULL` | Prompt category classification |
| `is_active` | `BOOLEAN` | **NO** | `TRUE` | Active template status flag |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

### C. `public.ai_scans`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Foreign Key to `public.projects(id)` |
| `provider_id` | `UUID` | **NO** | *None* | Foreign Key to `public.providers(id)` (`RESTRICT`) |
| `business_context_version_id` | `UUID` | YES | `NULL` | Foreign Key to `business_context_versions(id)` |
| `prompt_library_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `prompt_library(id)` |
| `prompt_text` | `TEXT` | **NO** | *None* | Immutable prompt text snapshot |
| `status` | `scan_status` | **NO** | `'queued'` | Scan lifecycle execution status |
| `model_name` | `VARCHAR(100)` | YES | `NULL` | Specific LLM model version string |
| `raw_response` | `TEXT` | YES | `NULL` | Verbatim text response string |
| `response_json` | `JSONB` | YES | `NULL` | Structured API response payload |
| `is_mentioned` | `BOOLEAN` | YES | `NULL` | Business mention detection flag |
| `mention_position` | `INTEGER` | YES | `NULL` | Character offset of mention in `raw_response` |
| `sentiment` | `sentiment_type` | YES | `NULL` | Mention sentiment classification |
| `summary_markdown` | `TEXT` | YES | `NULL` | Markdown summary of response |
| `api_latency_ms` | `INTEGER` | YES | `NULL` | Provider API latency in milliseconds |
| `input_tokens` | `INTEGER` | YES | `NULL` | Count of input tokens consumed |
| `output_tokens` | `INTEGER` | YES | `NULL` | Count of output tokens generated |
| `estimated_cost` | `NUMERIC(10,6)` | YES | `NULL` | Estimated API execution cost in USD |
| `started_at` | `TIMESTAMPTZ` | YES | `NULL` | Execution start timestamp |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Execution completion timestamp |
| `error_message` | `TEXT` | YES | `NULL` | Failure diagnostic log message |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

### D. `public.citations`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `ai_scan_id` | `UUID` | **NO** | *None* | Foreign Key to `public.ai_scans(id)` |
| `url` | `TEXT` | **NO** | *None* | Cited web URL |
| `title` | `TEXT` | YES | `NULL` | Cited page title |
| `position` | `INTEGER` | **NO** | *None* | 1-based citation position index |
| `is_own_domain` | `BOOLEAN` | **NO** | `FALSE` | Flag indicating if citation belongs to project |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |

---

## 4. Key Constraints & Indexes

### Unique Constraints
- `providers`: `CONSTRAINT uq_providers_slug UNIQUE (slug)`
- `prompt_library`: `CONSTRAINT uq_prompt_library_project_text UNIQUE (project_id, prompt_text)`
- `citations`: `CONSTRAINT uq_citations_scan_position UNIQUE (ai_scan_id, position)`

### Check Constraints
- `ai_scans.mention_position`: `mention_position IS NULL OR mention_position >= 0`
- `ai_scans.api_latency_ms`: `api_latency_ms IS NULL OR api_latency_ms >= 0`
- `ai_scans.input_tokens`: `input_tokens IS NULL OR input_tokens >= 0`
- `ai_scans.output_tokens`: `output_tokens IS NULL OR output_tokens >= 0`
- `ai_scans.estimated_cost`: `estimated_cost IS NULL OR estimated_cost >= 0`
- `citations.position`: `position > 0`
- `citations.url`: `url ~ '^https?://'`

### Indexes
- `idx_prompt_library_project_id ON public.prompt_library(project_id)`
- `idx_ai_scans_project_id ON public.ai_scans(project_id)`
- `idx_ai_scans_provider_id ON public.ai_scans(provider_id)`
- `idx_ai_scans_status ON public.ai_scans(status)`
- `idx_ai_scans_context_version_id ON public.ai_scans(business_context_version_id)`
- `idx_citations_scan_id ON public.citations(ai_scan_id)`
- `idx_citations_own_domain ON public.citations(ai_scan_id, is_own_domain) WHERE is_own_domain = TRUE`

---

## 5. RLS Policies & Access Control

Row Level Security is enabled on all 4 tables.

| Table | Permitted Operations | Policy Join Chain / Rule |
| :--- | :--- | :--- |
| `providers` | `SELECT` | Public readable (`USING (true)`). No write policies for client roles. |
| `prompt_library` | `SELECT`, `INSERT`, `UPDATE` | `projects.user_id = auth.uid()` |
| `ai_scans` | `SELECT`, `INSERT`, `UPDATE` | `projects.user_id = auth.uid()` |
| `citations` | `SELECT`, `INSERT` | `ai_scans` -> `projects.user_id = auth.uid()` (Immutable) |

> [!NOTE]
> `citations` intentionally omits an `UPDATE` policy because citations are immutable audit records created during scan processing. Client-facing `DELETE` policies are omitted across all tables.
