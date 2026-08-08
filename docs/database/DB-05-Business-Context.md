# DB-05 - Business Context (v2, Versioned)

## Overview

This document establishes the database architecture, schema, constraints, RLS policies, and versioning rules for **Business Context** in AI Visibility OS.

Every business context generation run creates a new version record (`public.business_context_versions`), with version-scoped child entities (`entities`, `topics`, `products`, `services`). Full historical context is preserved across regenerations without overwriting existing records.

---

## 1. Architectural Principles & Design Decisions

### A. Versioning Model (No Manual Version Counter)

- **Append-Only & Immutable**: `business_context_versions` and its child tables (`entities`, `topics`, `products`, `services`) are append-only. Each context extraction creates a new version record.
- **Race-Free Versioning**: No `version_number` column is stored, avoiding race-prone manual increments. The latest version for a project is determined dynamically:
  ```sql
  SELECT * FROM public.business_context_versions
  WHERE project_id = :project_id
  ORDER BY created_at DESC
  LIMIT 1;
  ```
- **Zero Update Triggers**: Versioned tables omit `updated_at` columns and triggers because rows are immutable once inserted.

### B. Domain-Scoped & Non-Versioned Technologies

- `public.technologies` remains scoped to `domain_id` rather than a business context version.
- **Rationale**: A technology stack (e.g. Next.js, Cloudflare, React) is an infrastructure fact detected on a domain. Infrastructure facts update in place (like `page_metadata`) and are re-used directly for competitor tech stack comparison in DB-07.

### C. Dedicated `products` & `services` Tables

- `'product'` was removed from `entity_type` enum (`organization`, `person`, `brand`, `location`, `other`).
- **Rationale**: Products and services are first-class business offerings that require structured tracking (`category`, `url`, `confidence_score`). Having dedicated `products` and `services` tables avoids dual-source ambiguity and enables direct per-product AI-mention tracking in subsequent features.

### D. Industry & Narrative Context Placement

- `industry`, `description`, `value_proposition`, and `target_audience` reside directly on `business_context_versions`.
- Storing `industry` per version preserves historical shifts in positioning or pivot history over time.

---

## 2. Enums

### `public.extraction_method`

```sql
CREATE TYPE public.extraction_method AS ENUM ('deterministic', 'ai_assisted');
```

### `public.entity_type`

```sql
CREATE TYPE public.entity_type AS ENUM ('organization', 'person', 'brand', 'location', 'other');
```

---

## 3. Table Definitions

### A. `public.business_context_versions`

| Column                   | Type                | Nullable | Default             | Description                                                                         |
| :----------------------- | :------------------ | :------- | :------------------ | :---------------------------------------------------------------------------------- |
| `id`                     | `UUID`              | **NO**   | `gen_random_uuid()` | Primary Key                                                                         |
| `project_id`             | `UUID`              | **NO**   | _None_              | Foreign Key to `public.projects(id)`                                                |
| `industry`               | `VARCHAR(100)`      | YES      | `NULL`              | Business industry classification                                                    |
| `description`            | `TEXT`              | YES      | `NULL`              | Extracted business narrative                                                        |
| `value_proposition`      | `TEXT`              | YES      | `NULL`              | Core value proposition statement                                                    |
| `target_audience`        | `TEXT[]`            | YES      | `NULL`              | Array of target audience segments                                                   |
| `extraction_method`      | `extraction_method` | **NO**   | `'deterministic'`   | Extraction pipeline method                                                          |
| `confidence_score`       | `NUMERIC(3,2)`      | YES      | `NULL`              | Extraction confidence (0.00 - 1.00)                                                 |
| `generated_at`           | `TIMESTAMPTZ`       | **NO**   | `now()`             | Context generation timestamp                                                        |
| `generation_duration_ms` | `INTEGER`           | YES      | `NULL`              | Generation duration in ms (populated by Trigger.dev job for performance monitoring) |
| `created_at`             | `TIMESTAMPTZ`       | **NO**   | `now()`             | Record creation timestamp (UTC)                                                     |

### B. `public.entities`

| Column                        | Type                | Nullable | Default             | Description                                    |
| :---------------------------- | :------------------ | :------- | :------------------ | :--------------------------------------------- |
| `id`                          | `UUID`              | **NO**   | `gen_random_uuid()` | Primary Key                                    |
| `business_context_version_id` | `UUID`              | **NO**   | _None_              | Foreign Key to `business_context_versions(id)` |
| `entity_type`                 | `entity_type`       | **NO**   | _None_              | Entity category                                |
| `name`                        | `VARCHAR(255)`      | **NO**   | _None_              | Entity name                                    |
| `description`                 | `TEXT`              | YES      | `NULL`              | Entity description                             |
| `source_page_id`              | `UUID`              | YES      | `NULL`              | Optional Foreign Key to `public.pages(id)`     |
| `extraction_method`           | `extraction_method` | **NO**   | `'deterministic'`   | Extraction method                              |
| `confidence_score`            | `NUMERIC(3,2)`      | YES      | `NULL`              | Confidence score (0.00 - 1.00)                 |
| `created_at`                  | `TIMESTAMPTZ`       | **NO**   | `now()`             | Record creation timestamp (UTC)                |

### C. `public.topics`

| Column                        | Type                | Nullable | Default             | Description                                    |
| :---------------------------- | :------------------ | :------- | :------------------ | :--------------------------------------------- |
| `id`                          | `UUID`              | **NO**   | `gen_random_uuid()` | Primary Key                                    |
| `business_context_version_id` | `UUID`              | **NO**   | _None_              | Foreign Key to `business_context_versions(id)` |
| `name`                        | `VARCHAR(255)`      | **NO**   | _None_              | Topic or keyword name                          |
| `relevance_score`             | `NUMERIC(3,2)`      | YES      | `NULL`              | Relevance score (0.00 - 1.00)                  |
| `source_page_id`              | `UUID`              | YES      | `NULL`              | Optional Foreign Key to `public.pages(id)`     |
| `extraction_method`           | `extraction_method` | **NO**   | `'deterministic'`   | Extraction method                              |
| `created_at`                  | `TIMESTAMPTZ`       | **NO**   | `now()`             | Record creation timestamp (UTC)                |

### D. `public.products`

| Column                        | Type                | Nullable | Default             | Description                                    |
| :---------------------------- | :------------------ | :------- | :------------------ | :--------------------------------------------- |
| `id`                          | `UUID`              | **NO**   | `gen_random_uuid()` | Primary Key                                    |
| `business_context_version_id` | `UUID`              | **NO**   | _None_              | Foreign Key to `business_context_versions(id)` |
| `name`                        | `VARCHAR(255)`      | **NO**   | _None_              | Product name                                   |
| `description`                 | `TEXT`              | YES      | `NULL`              | Product description                            |
| `category`                    | `VARCHAR(100)`      | YES      | `NULL`              | Product classification                         |
| `url`                         | `TEXT`              | YES      | `NULL`              | Product landing page URL                       |
| `source_page_id`              | `UUID`              | YES      | `NULL`              | Optional Foreign Key to `public.pages(id)`     |
| `extraction_method`           | `extraction_method` | **NO**   | `'deterministic'`   | Extraction method                              |
| `confidence_score`            | `NUMERIC(3,2)`      | YES      | `NULL`              | Confidence score (0.00 - 1.00)                 |
| `created_at`                  | `TIMESTAMPTZ`       | **NO**   | `now()`             | Record creation timestamp (UTC)                |

### E. `public.services`

| Column                        | Type                | Nullable | Default             | Description                                    |
| :---------------------------- | :------------------ | :------- | :------------------ | :--------------------------------------------- |
| `id`                          | `UUID`              | **NO**   | `gen_random_uuid()` | Primary Key                                    |
| `business_context_version_id` | `UUID`              | **NO**   | _None_              | Foreign Key to `business_context_versions(id)` |
| `name`                        | `VARCHAR(255)`      | **NO**   | _None_              | Service name                                   |
| `description`                 | `TEXT`              | YES      | `NULL`              | Service description                            |
| `category`                    | `VARCHAR(100)`      | YES      | `NULL`              | Service classification                         |
| `url`                         | `TEXT`              | YES      | `NULL`              | Service landing page URL                       |
| `source_page_id`              | `UUID`              | YES      | `NULL`              | Optional Foreign Key to `public.pages(id)`     |
| `extraction_method`           | `extraction_method` | **NO**   | `'deterministic'`   | Extraction method                              |
| `confidence_score`            | `NUMERIC(3,2)`      | YES      | `NULL`              | Confidence score (0.00 - 1.00)                 |
| `created_at`                  | `TIMESTAMPTZ`       | **NO**   | `now()`             | Record creation timestamp (UTC)                |

### F. `public.technologies`

| Column           | Type           | Nullable | Default             | Description                                |
| :--------------- | :------------- | :------- | :------------------ | :----------------------------------------- |
| `id`             | `UUID`         | **NO**   | `gen_random_uuid()` | Primary Key                                |
| `domain_id`      | `UUID`         | **NO**   | _None_              | Foreign Key to `public.domains(id)`        |
| `name`           | `VARCHAR(255)` | **NO**   | _None_              | Technology name                            |
| `category`       | `VARCHAR(100)` | YES      | `NULL`              | Technology category                        |
| `source_page_id` | `UUID`         | YES      | `NULL`              | Optional Foreign Key to `public.pages(id)` |
| `detected_at`    | `TIMESTAMPTZ`  | **NO**   | `now()`             | Detection timestamp                        |
| `created_at`     | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record creation timestamp (UTC)            |
| `updated_at`     | `TIMESTAMPTZ`  | **NO**   | `now()`             | Record modification timestamp (UTC)        |

---

## 4. Key Constraints & Indexes

### Unique Constraints

- `entities`: `CONSTRAINT uq_entities_version_name_type UNIQUE (business_context_version_id, name, entity_type)`
- `topics`: `CONSTRAINT uq_topics_version_name UNIQUE (business_context_version_id, name)`
- `products`: `CONSTRAINT uq_products_version_name UNIQUE (business_context_version_id, name)`
- `services`: `CONSTRAINT uq_services_version_name UNIQUE (business_context_version_id, name)`
- `technologies`: `CONSTRAINT uq_technologies_domain_name UNIQUE (domain_id, name)`

### Check Constraints

- Scores (0.00 - 1.00): `confidence_score` and `relevance_score` enforce `BETWEEN 0 AND 1` (or `NULL`).
- URL Format: `products.url` and `services.url` enforce `url IS NULL OR url ~ '^https?://'`.

---

## 5. RLS Policies & Access Control

Row Level Security is enabled on all 6 tables.

| Table                       | Permitted Operations         | Policy Join Chain                                              |
| :-------------------------- | :--------------------------- | :------------------------------------------------------------- |
| `business_context_versions` | `SELECT`, `INSERT`           | `projects.user_id = auth.uid()`                                |
| `entities`                  | `SELECT`, `INSERT`           | `business_context_versions` -> `projects.user_id = auth.uid()` |
| `topics`                    | `SELECT`, `INSERT`           | `business_context_versions` -> `projects.user_id = auth.uid()` |
| `products`                  | `SELECT`, `INSERT`           | `business_context_versions` -> `projects.user_id = auth.uid()` |
| `services`                  | `SELECT`, `INSERT`           | `business_context_versions` -> `projects.user_id = auth.uid()` |
| `technologies`              | `SELECT`, `INSERT`, `UPDATE` | `domains` -> `projects.user_id = auth.uid()`                   |

> [!NOTE]
> All versioned tables omit `UPDATE` policies to guarantee immutability. No table includes client-facing `DELETE` policies (deletions cascade automatically when parent projects or domains are deleted).
