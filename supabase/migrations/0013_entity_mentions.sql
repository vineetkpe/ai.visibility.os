-- Migration: 0013_entity_mentions.sql
-- Description: Creates global tracked entities catalog (tracked_entities) and scan mention records (entity_mentions), triggers, RLS policies, and Data API grants.
-- Idempotent: Safe to execute on fresh schema following 0012_data_api_grants.sql.

-- -----------------------------------------------------------------------------
-- 1. TABLES & CONSTRAINTS
-- -----------------------------------------------------------------------------

-- Table: tracked_entities
CREATE TABLE public.tracked_entities (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_type public.entity_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_tracked_entities PRIMARY KEY (id)
);

-- Table: entity_mentions
CREATE TABLE public.entity_mentions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tracked_entity_id UUID NOT NULL,
    ai_scan_id UUID NOT NULL,
    context_snippet TEXT NULL,
    sentiment public.sentiment_type NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_entity_mentions PRIMARY KEY (id),
    CONSTRAINT fk_entity_mentions_entity FOREIGN KEY (tracked_entity_id) REFERENCES public.tracked_entities(id) ON DELETE CASCADE,
    CONSTRAINT fk_entity_mentions_scan FOREIGN KEY (ai_scan_id) REFERENCES public.ai_scans(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 2. INDEXES
-- -----------------------------------------------------------------------------

-- Case-insensitive deduplication for tracked_entities
CREATE UNIQUE INDEX uq_tracked_entities_name_lower ON public.tracked_entities (lower(name));

-- Indexes for entity_mentions
CREATE INDEX idx_entity_mentions_scan_id ON public.entity_mentions(ai_scan_id);
CREATE INDEX idx_entity_mentions_entity_id ON public.entity_mentions(tracked_entity_id);

-- -----------------------------------------------------------------------------
-- 3. TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_tracked_entities_set_updated_at
    BEFORE UPDATE ON public.tracked_entities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

-- tracked_entities
ALTER TABLE public.tracked_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tracked_entities_select_all ON public.tracked_entities FOR SELECT
    USING (true);

CREATE POLICY tracked_entities_insert_all ON public.tracked_entities FOR INSERT
    WITH CHECK (true);

-- entity_mentions
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY entity_mentions_select_own ON public.entity_mentions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.ai_scans s
        JOIN public.projects p ON p.id = s.project_id
        WHERE s.id = entity_mentions.ai_scan_id AND p.user_id = auth.uid()
    ));

CREATE POLICY entity_mentions_insert_own ON public.entity_mentions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ai_scans s
        JOIN public.projects p ON p.id = s.project_id
        WHERE s.id = entity_mentions.ai_scan_id AND p.user_id = auth.uid()
    ));

-- -----------------------------------------------------------------------------
-- 5. DATA API GRANTS
-- -----------------------------------------------------------------------------

GRANT SELECT, INSERT ON public.tracked_entities TO authenticated;
GRANT SELECT, INSERT ON public.entity_mentions TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. POSTGREST SCHEMA CACHE RELOAD
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
