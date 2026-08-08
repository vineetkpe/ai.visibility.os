# DB-10 - Global Entity Mention Tracking

## Overview

This document establishes the database architecture, schema, constraints, RLS policies, and Data API permissions for **Global Entity Mention Tracking** (`tracked_entities` and `entity_mentions`) in AI Visibility OS.

This feature restores the capability to track which brands, competitors, organizations, people, and products are named across AI scan responses over time platform-wide, decoupled from individual project extractions.

---

## 1. Architectural Principles & Key Design Decisions

### A. Global Entity Catalog (`tracked_entities`) vs. Business Context (`entities`)

- **Naming Distinction**: The global catalog is explicitly named `tracked_entities` to prevent naming collisions and architectural ambiguity with `public.entities` (from DB-05).
- **Domain Scope Difference**:
  - `public.entities` (DB-05): Scoped to a specific `business_context_version_id` within a single project. Captures business context extractions from site crawls.
  - `public.tracked_entities` (DB-10): Global, platform-wide deduplicated catalog of all entities detected across LLM scan responses across all users and projects.
- **Shared Concept**: Similar to the global entities catalog in legacy schema, `tracked_entities` acts as a common vocabulary of brands, competitors, and products.

### B. Case-Insensitive Deduplication (`lower(name)`)

- **Constraint**: `CREATE UNIQUE INDEX uq_tracked_entities_name_lower ON public.tracked_entities (lower(name));`
- **Improvement over Old Schema**: Legacy schema relied on exact-string matching, resulting in duplicate entries (e.g. "Acme Corp" vs "acme corp" vs "ACME CORP"). The lower-case unique index enforces canonical case-insensitive uniqueness at the database engine level.

### C. Multiple Mentions per Scan & Immutability (`entity_mentions`)

- **No Uniqueness Constraint on (ai_scan_id, tracked_entity_id)**: Deliberately omitted. An AI scan response can legitimately mention the same entity multiple times in different context snippets with different sentiments (e.g. positive snippet in paragraph 1, neutral/negative snippet in paragraph 3).
- **Immutability**: `public.entity_mentions` represents point-in-time evidence extracted during scan processing. It omits `updated_at` and possesses no `UPDATE` or `DELETE` RLS policies for client roles (matching `public.citations`).

### D. Implicit Project Ownership via AI Scans

- **Normalized Schema**: `entity_mentions` links directly to `ai_scan_id` and does not duplicate `project_id`.
- **Derivation**: Project ownership and user security boundaries are evaluated dynamically via `ai_scan_id -> ai_scans.project_id -> projects.user_id`, preventing redundant denormalization.

---

## 2. Reused Enums

Rather than defining redundant enum types, DB-10 reuses existing schema primitives:

- **`public.entity_type`** (DB-05): `'organization'`, `'person'`, `'brand'`, `'location'`, `'other'`
- **`public.sentiment_type`** (DB-06): `'positive'`, `'neutral'`, `'negative'`

---

## 3. Table Definitions

### A. `public.tracked_entities`

| Column        | Type          | Nullable | Default             | Description                             |
| :------------ | :------------ | :------- | :------------------ | :-------------------------------------- |
| `id`          | `UUID`        | **NO**   | `gen_random_uuid()` | Primary Key                             |
| `name`        | `TEXT`        | **NO**   | _None_              | Entity display name                     |
| `entity_type` | `entity_type` | **NO**   | _None_              | Entity classification enum (DB-05)      |
| `created_at`  | `TIMESTAMPTZ` | **NO**   | `now()`             | Catalog record creation timestamp (UTC) |
| `updated_at`  | `TIMESTAMPTZ` | **NO**   | `now()`             | Record update timestamp (UTC)           |

### B. `public.entity_mentions`

| Column              | Type             | Nullable | Default             | Description                                              |
| :------------------ | :--------------- | :------- | :------------------ | :------------------------------------------------------- |
| `id`                | `UUID`           | **NO**   | `gen_random_uuid()` | Primary Key                                              |
| `tracked_entity_id` | `UUID`           | **NO**   | _None_              | Foreign Key to `public.tracked_entities(id)` (`CASCADE`) |
| `ai_scan_id`        | `UUID`           | **NO**   | _None_              | Foreign Key to `public.ai_scans(id)` (`CASCADE`)         |
| `context_snippet`   | `TEXT`           | YES      | `NULL`              | Sentence/paragraph snippet containing mention            |
| `sentiment`         | `sentiment_type` | YES      | `NULL`              | Sentiment classification enum (DB-06)                    |
| `created_at`        | `TIMESTAMPTZ`    | **NO**   | `now()`             | Mention creation timestamp (UTC)                         |

---

## 4. Indexes & Constraints

```sql
-- Case-insensitive deduplication index on tracked_entities
CREATE UNIQUE INDEX uq_tracked_entities_name_lower ON public.tracked_entities (lower(name));

-- Scan lookup index on entity_mentions
CREATE INDEX idx_entity_mentions_scan_id ON public.entity_mentions(ai_scan_id);

-- Entity lookup index on entity_mentions
CREATE INDEX idx_entity_mentions_entity_id ON public.entity_mentions(tracked_entity_id);
```

---

## 5. Triggers & RLS Policies

### Triggers

- `trg_tracked_entities_set_updated_at`: `BEFORE UPDATE ON public.tracked_entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`

### Row Level Security (RLS)

#### `tracked_entities`

```sql
ALTER TABLE public.tracked_entities ENABLE ROW LEVEL SECURITY;

-- Shared platform catalog: any authenticated user can view catalog entries
CREATE POLICY tracked_entities_select_all ON public.tracked_entities FOR SELECT
    USING (true);

-- Any scan execution can discover and register new global entities
CREATE POLICY tracked_entities_insert_all ON public.tracked_entities FOR INSERT
    WITH CHECK (true);
```

_(No UPDATE or DELETE policies for authenticated users — entities are accumulated as global platform metadata)._

#### `entity_mentions`

```sql
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;

-- Select own scan entity mentions
CREATE POLICY entity_mentions_select_own ON public.entity_mentions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.ai_scans s
        JOIN public.projects p ON p.id = s.project_id
        WHERE s.id = entity_mentions.ai_scan_id AND p.user_id = auth.uid()
    ));

-- Insert mentions for own scan
CREATE POLICY entity_mentions_insert_own ON public.entity_mentions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ai_scans s
        JOIN public.projects p ON p.id = s.project_id
        WHERE s.id = entity_mentions.ai_scan_id AND p.user_id = auth.uid()
    ));
```

_(No UPDATE or DELETE policies — immutable scan evidence)._

---

## 6. Data API Grants

Per project security standards:

```sql
GRANT SELECT, INSERT ON public.tracked_entities TO authenticated;
GRANT SELECT, INSERT ON public.entity_mentions TO authenticated;

NOTIFY pgrst, 'reload schema';
```
