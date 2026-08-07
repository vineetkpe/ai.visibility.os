-- Migration: 0009_competitors_recommendations.sql
-- Description: Creates Competitors & Recommendations schema (domain_type, competitor_source, competitor_status, recommendation_status enums, competitors, recommendations, recommendation_evidence tables, citations competitor reference, domain_type trigger enforcement, indexes, and RLS policies).
-- Idempotent: Safe to execute on fresh schema following 0008_ai_visibility_engine.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.domain_type AS ENUM ('own', 'competitor');
CREATE TYPE public.competitor_source AS ENUM ('user_added', 'ai_suggested');
CREATE TYPE public.competitor_status AS ENUM ('suggested', 'confirmed', 'dismissed');
CREATE TYPE public.recommendation_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- 2. ALTER DOMAINS TABLE
-- -----------------------------------------------------------------------------

ALTER TABLE public.domains 
    ADD COLUMN domain_type public.domain_type NOT NULL DEFAULT 'own';

ALTER TABLE public.domains 
    ADD CONSTRAINT chk_domains_competitor_not_primary 
    CHECK (NOT (domain_type = 'competitor' AND is_primary = TRUE));

-- -----------------------------------------------------------------------------
-- 3. COMPETITORS TABLE & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.competitors (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    domain_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    source public.competitor_source NOT NULL DEFAULT 'user_added',
    status public.competitor_status NOT NULL DEFAULT 'suggested',
    confirmed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_competitors PRIMARY KEY (id),
    CONSTRAINT fk_competitors_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_competitors_domain FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE,
    CONSTRAINT uq_competitors_project_domain UNIQUE (project_id, domain_id)
);

CREATE OR REPLACE FUNCTION public.enforce_competitor_domain_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.domains
        WHERE id = NEW.domain_id AND domain_type = 'competitor'
    ) THEN
        RAISE EXCEPTION 'competitors.domain_id must reference a domains row with domain_type = ''competitor''';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_competitors_enforce_domain_type
    BEFORE INSERT OR UPDATE OF domain_id ON public.competitors
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_competitor_domain_type();

CREATE TRIGGER trg_competitors_set_updated_at
    BEFORE UPDATE ON public.competitors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. ALTER CITATIONS TABLE
-- -----------------------------------------------------------------------------

ALTER TABLE public.citations 
    ADD COLUMN competitor_id UUID NULL REFERENCES public.competitors(id) ON DELETE SET NULL;

ALTER TABLE public.citations 
    ADD CONSTRAINT chk_citations_competitor_not_own 
    CHECK (competitor_id IS NULL OR is_own_domain = FALSE);

-- -----------------------------------------------------------------------------
-- 5. RECOMMENDATIONS TABLE & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NULL,
    impact_score SMALLINT NOT NULL,
    effort_score SMALLINT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status public.recommendation_status NOT NULL DEFAULT 'open',
    scope_key VARCHAR(255) NOT NULL,
    generation_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_recommendations PRIMARY KEY (id),
    CONSTRAINT fk_recommendations_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_recommendations_project_scope_key UNIQUE (project_id, scope_key),
    CONSTRAINT chk_recommendations_impact CHECK (impact_score BETWEEN 1 AND 5),
    CONSTRAINT chk_recommendations_effort CHECK (effort_score BETWEEN 1 AND 5),
    CONSTRAINT chk_recommendations_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE TRIGGER trg_recommendations_set_updated_at
    BEFORE UPDATE ON public.recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. RECOMMENDATION EVIDENCE TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE public.recommendation_evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL,
    page_id UUID NULL,
    ai_scan_id UUID NULL,
    citation_id UUID NULL,
    competitor_id UUID NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_recommendation_evidence PRIMARY KEY (id),
    CONSTRAINT fk_recommendation_evidence_recommendation FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendation_evidence_page FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT fk_recommendation_evidence_scan FOREIGN KEY (ai_scan_id) REFERENCES public.ai_scans(id) ON DELETE SET NULL,
    CONSTRAINT fk_recommendation_evidence_citation FOREIGN KEY (citation_id) REFERENCES public.citations(id) ON DELETE SET NULL,
    CONSTRAINT fk_recommendation_evidence_competitor FOREIGN KEY (competitor_id) REFERENCES public.competitors(id) ON DELETE SET NULL,
    CONSTRAINT chk_recommendation_evidence_has_source CHECK (page_id IS NOT NULL OR ai_scan_id IS NOT NULL OR citation_id IS NOT NULL OR competitor_id IS NOT NULL)
);

-- -----------------------------------------------------------------------------
-- 7. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_competitors_project_id ON public.competitors(project_id);
CREATE INDEX idx_competitors_domain_id ON public.competitors(domain_id);
CREATE INDEX idx_competitors_status ON public.competitors(status);
CREATE INDEX idx_citations_competitor_id ON public.citations(competitor_id);
CREATE INDEX idx_recommendations_project_id ON public.recommendations(project_id);
CREATE INDEX idx_recommendations_status ON public.recommendations(status);
CREATE INDEX idx_recommendation_evidence_recommendation_id ON public.recommendation_evidence(recommendation_id);

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

-- competitors
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitors_select_own ON public.competitors FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = competitors.project_id AND p.user_id = auth.uid()));

CREATE POLICY competitors_insert_own ON public.competitors FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = competitors.project_id AND p.user_id = auth.uid()));

CREATE POLICY competitors_update_own ON public.competitors FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = competitors.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = competitors.project_id AND p.user_id = auth.uid()));

CREATE POLICY competitors_delete_own ON public.competitors FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = competitors.project_id AND p.user_id = auth.uid()));

-- recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY recommendations_select_own ON public.recommendations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = recommendations.project_id AND p.user_id = auth.uid()));

CREATE POLICY recommendations_insert_own ON public.recommendations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = recommendations.project_id AND p.user_id = auth.uid()));

CREATE POLICY recommendations_update_own ON public.recommendations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = recommendations.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = recommendations.project_id AND p.user_id = auth.uid()));

-- recommendation_evidence
ALTER TABLE public.recommendation_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY recommendation_evidence_select_own ON public.recommendation_evidence FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.recommendations r JOIN public.projects p ON p.id = r.project_id WHERE r.id = recommendation_evidence.recommendation_id AND p.user_id = auth.uid()));

CREATE POLICY recommendation_evidence_insert_own ON public.recommendation_evidence FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.recommendations r JOIN public.projects p ON p.id = r.project_id WHERE r.id = recommendation_evidence.recommendation_id AND p.user_id = auth.uid()));
