# DB-07 - Competitors & Recommendations

## Overview
This document establishes the database architecture, schema, constraints, RLS policies, and design decisions for **Competitor Tracking** and the **Deterministic Recommendation Engine** in AI Visibility OS.

It details how competitor tracking reuses the existing `domains` and `citations` infrastructure via `domain_type` and optional `competitor_id` references, how recommendation deduplication is strictly enforced at the database layer using `scope_key`, and the specific authorization lifecycle rules for competitors versus recommendations.

---

## 1. Architectural Principles & Key Design Decisions

### A. Citations Infrastructure Reuse (`citations.competitor_id`)
- **Design Choice**: Rather than introducing a duplicate `competitor_scans` or `competitor_citations` table, competitor visibility is tracked by extending the existing `public.citations` table with an optional `competitor_id UUID NULL REFERENCES public.competitors(id) ON DELETE SET NULL`.
- **Constraint Enforcement**: `chk_citations_competitor_not_own` (`competitor_id IS NULL OR is_own_domain = FALSE`) prevents invalid state where a citation is tagged as both an own-domain citation and a competitor domain citation.
- **Data Retention**: Setting `ON DELETE SET NULL` ensures that if a competitor record is un-tracked/deleted, the underlying historical LLM scan citation records remain preserved for analytical continuity.

### B. Competitor Domain Type Trigger Enforcement
- **Limitation of Plain Foreign Keys**: PostgreSQL foreign keys cannot enforce a condition on attributes of the referenced row (i.e. `domains.domain_type = 'competitor'`).
- **Trigger Solution**: A PL/pgSQL function `public.enforce_competitor_domain_type()` and trigger `trg_competitors_enforce_domain_type` execute `BEFORE INSERT OR UPDATE OF domain_id ON public.competitors`. This ensures `competitors.domain_id` strictly references a `domains` row where `domain_type = 'competitor'`, mirroring the structural rigor of the composite FK approach in DB-04 (`pages.domain_id`).

### C. Confirmed Status & Application Responsibility
- **Default Column Value**: `competitors.status` defaults to `'suggested'` at the database level.
- **Application Responsibility**: When a user explicitly inputs a competitor (i.e. `source = 'user_added'`), application logic is responsible for setting `status = 'confirmed'` and `confirmed_at = now()` at insertion time. AI-discovered competitors default to `source = 'ai_suggested'` and `status = 'suggested'`, awaiting explicit user confirmation or dismissal.

### D. Hard-DELETE Authorization on Competitors vs. Append-Only System
- **Competitors Table Exception**: Unlike other core tables in this sprint which enforce soft deletes (`deleted_at`) or omit `DELETE` RLS policies, `public.competitors` explicitly permits `DELETE` operations for authenticated owners.
- **Rationale**: Removing/untracking a competitor is a standard project setup action rather than historical domain analysis. Historical LLM scan data remains intact via `citations.competitor_id ON DELETE SET NULL` and `recommendation_evidence.competitor_id ON DELETE SET NULL`.
- **Recommendations Immutability**: `recommendations` and `recommendation_evidence` omit `DELETE` policies; resolved or dismissed recommendations persist historically to support auditability and prevent repeated auto-generation.

### E. DB-Enforced Recommendation Deduplication (`scope_key`)
- **Dedup Mechanism**: `public.recommendations` enforces `CONSTRAINT uq_recommendations_project_scope_key UNIQUE (project_id, scope_key)`.
- **Scope Key Rationale**: `scope_key` is a deterministic string constructed by the recommendation engine (e.g. `missing_schema_org_faq`, `competitor_citation_gap_acme`). Database-level unique constraint prevents duplicate recommendation insertion across recurring scans regardless of application concurrency or retries.
- **Priority Calculation**: Recommendation priority (`low`, `medium`, `high`, `critical`) is computed in application logic from `impact_score` (1-5) and `effort_score` (1-5) matrices and stored in `priority` for query transparency.

### F. Omission of `recommendation_history`
- **Scope Boundary**: A separate `recommendation_history` tracking table was deliberately omitted from this schema iteration to match the explicit core table specification. Recommendation state transitions (`open` -> `in_progress` -> `resolved` / `dismissed`) are maintained directly on `public.recommendations.status` and `resolved_at`.

---

## 2. Enums

### `public.domain_type`
```sql
CREATE TYPE public.domain_type AS ENUM ('own', 'competitor');
```

### `public.competitor_source`
```sql
CREATE TYPE public.competitor_source AS ENUM ('user_added', 'ai_suggested');
```

### `public.competitor_status`
```sql
CREATE TYPE public.competitor_status AS ENUM ('suggested', 'confirmed', 'dismissed');
```

### `public.recommendation_status`
```sql
CREATE TYPE public.recommendation_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');
```

---

## 3. Altered Tables

### A. `public.domains`
Added column and constraint to distinguish primary/own domains from competitor domains:
- Column: `domain_type public.domain_type NOT NULL DEFAULT 'own'`
- Constraint: `CONSTRAINT chk_domains_competitor_not_primary CHECK (NOT (domain_type = 'competitor' AND is_primary = TRUE))`

### B. `public.citations`
Added column and constraint to link scan citations to competitor records:
- Column: `competitor_id UUID NULL REFERENCES public.competitors(id) ON DELETE SET NULL`
- Constraint: `CONSTRAINT chk_citations_competitor_not_own CHECK (competitor_id IS NULL OR is_own_domain = FALSE)`

---

## 4. Table Definitions

### A. `public.competitors`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Foreign Key to `public.projects(id)` (`CASCADE`) |
| `domain_id` | `UUID` | **NO** | *None* | Foreign Key to `public.domains(id)` (`CASCADE`) |
| `name` | `VARCHAR(255)` | **NO** | *None* | Competitor display name |
| `source` | `competitor_source` | **NO** | `'user_added'` | Discovery source origin |
| `status` | `competitor_status` | **NO** | `'suggested'` | Competitor confirmation state |
| `confirmed_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp when confirmed |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

### B. `public.recommendations`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `project_id` | `UUID` | **NO** | *None* | Foreign Key to `public.projects(id)` (`CASCADE`) |
| `category` | `VARCHAR(100)` | **NO** | *None* | Action category (e.g., content, schema) |
| `title` | `TEXT` | **NO** | *None* | Concise action title |
| `description` | `TEXT` | YES | `NULL` | Detailed context and instructions |
| `impact_score` | `SMALLINT` | **NO** | *None* | Estimated business impact (1..5) |
| `effort_score` | `SMALLINT` | **NO** | *None* | Estimated effort required (1..5) |
| `priority` | `VARCHAR(20)` | **NO** | *None* | Priority level (`low`,`medium`,`high`,`critical`) |
| `status` | `recommendation_status` | **NO** | `'open'` | Lifecycle state |
| `scope_key` | `VARCHAR(255)` | **NO** | *None* | Deterministic DB dedup key per project |
| `generation_method` | `extraction_method` | **NO** | `'deterministic'` | Reused enum from DB-05 |
| `resolved_at` | `TIMESTAMPTZ` | YES | `NULL` | Resolution completion timestamp |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record modification timestamp (UTC) |

### C. `public.recommendation_evidence`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | `gen_random_uuid()` | Primary Key |
| `recommendation_id` | `UUID` | **NO** | *None* | Foreign Key to `recommendations(id)` (`CASCADE`) |
| `page_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `pages(id)` (`SET NULL`) |
| `ai_scan_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `ai_scans(id)` (`SET NULL`) |
| `citation_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `citations(id)` (`SET NULL`) |
| `competitor_id` | `UUID` | YES | `NULL` | Optional Foreign Key to `competitors(id)` (`SET NULL`) |
| `notes` | `TEXT` | YES | `NULL` | Supporting evidence context notes |
| `created_at` | `TIMESTAMPTZ` | **NO** | `now()` | Record creation timestamp (UTC) |

---

## 5. Constraints & Indexes

### Unique Constraints
- `public.competitors`: `CONSTRAINT uq_competitors_project_domain UNIQUE (project_id, domain_id)`
- `public.recommendations`: `CONSTRAINT uq_recommendations_project_scope_key UNIQUE (project_id, scope_key)`

### Check Constraints
- `public.domains`: `chk_domains_competitor_not_primary` (`NOT (domain_type = 'competitor' AND is_primary = TRUE)`)
- `public.citations`: `chk_citations_competitor_not_own` (`competitor_id IS NULL OR is_own_domain = FALSE`)
- `public.recommendations`:
  - `chk_recommendations_impact` (`impact_score BETWEEN 1 AND 5`)
  - `chk_recommendations_effort` (`effort_score BETWEEN 1 AND 5`)
  - `chk_recommendations_priority` (`priority IN ('low', 'medium', 'high', 'critical')`)
- `public.recommendation_evidence`:
  - `chk_recommendation_evidence_has_source` (`page_id IS NOT NULL OR ai_scan_id IS NOT NULL OR citation_id IS NOT NULL OR competitor_id IS NOT NULL`)

### Indexes
- `idx_competitors_project_id ON public.competitors(project_id)`
- `idx_competitors_domain_id ON public.competitors(domain_id)`
- `idx_competitors_status ON public.competitors(status)`
- `idx_citations_competitor_id ON public.citations(competitor_id)`
- `idx_recommendations_project_id ON public.recommendations(project_id)`
- `idx_recommendations_status ON public.recommendations(status)`
- `idx_recommendation_evidence_recommendation_id ON public.recommendation_evidence(recommendation_id)`

---

## 6. Row Level Security Policies

Row Level Security is enabled on `competitors`, `recommendations`, and `recommendation_evidence`.

| Table | Permitted Operations | Policy Join Chain / Rule |
| :--- | :--- | :--- |
| `competitors` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `projects.user_id = auth.uid()` |
| `recommendations` | `SELECT`, `INSERT`, `UPDATE` | `projects.user_id = auth.uid()` (No `DELETE`) |
| `recommendation_evidence` | `SELECT`, `INSERT` | `recommendations` -> `projects.user_id = auth.uid()` (Immutable) |

> [!NOTE]
> `competitors` is explicitly hard-DELETE-able by project owners. Untracking a competitor cascade-deletes the `competitors` row while `citations.competitor_id` and `recommendation_evidence.competitor_id` are set to `NULL`, retaining analytical scan records.
