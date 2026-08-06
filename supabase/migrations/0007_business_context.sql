-- Migration: 0007_business_context.sql
-- Description: Creates versioned business context schema (business_context_versions, entities, topics, products, services) and domain-scoped technologies table.
-- Idempotent: Safe to execute on fresh schema following 0006_fix_crawl_errors_append_only.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.extraction_method AS ENUM ('deterministic', 'ai_assisted');
CREATE TYPE public.entity_type AS ENUM ('organization', 'person', 'brand', 'location', 'other');

-- -----------------------------------------------------------------------------
-- 2. TABLES & CONSTRAINTS
-- -----------------------------------------------------------------------------

-- Table: business_context_versions
CREATE TABLE public.business_context_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    industry VARCHAR(100) NULL,
    description TEXT NULL,
    value_proposition TEXT NULL,
    target_audience TEXT[] NULL,
    extraction_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    confidence_score NUMERIC(3,2) NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    generation_duration_ms INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_business_context_versions PRIMARY KEY (id),
    CONSTRAINT fk_business_context_versions_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_business_context_versions_confidence CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
    CONSTRAINT chk_business_context_versions_duration CHECK (generation_duration_ms IS NULL OR generation_duration_ms >= 0)
);

-- Table: entities
CREATE TABLE public.entities (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    business_context_version_id UUID NOT NULL,
    entity_type public.entity_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source_page_id UUID NULL,
    extraction_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    confidence_score NUMERIC(3,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_entities PRIMARY KEY (id),
    CONSTRAINT fk_entities_version FOREIGN KEY (business_context_version_id) REFERENCES public.business_context_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_entities_source_page FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT uq_entities_version_name_type UNIQUE (business_context_version_id, name, entity_type),
    CONSTRAINT chk_entities_confidence CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1)
);

-- Table: topics
CREATE TABLE public.topics (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    business_context_version_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    relevance_score NUMERIC(3,2) NULL,
    source_page_id UUID NULL,
    extraction_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_topics PRIMARY KEY (id),
    CONSTRAINT fk_topics_version FOREIGN KEY (business_context_version_id) REFERENCES public.business_context_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_topics_source_page FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT uq_topics_version_name UNIQUE (business_context_version_id, name),
    CONSTRAINT chk_topics_relevance CHECK (relevance_score IS NULL OR relevance_score BETWEEN 0 AND 1)
);

-- Table: products
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    business_context_version_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    url TEXT NULL,
    source_page_id UUID NULL,
    extraction_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    confidence_score NUMERIC(3,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT fk_products_version FOREIGN KEY (business_context_version_id) REFERENCES public.business_context_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_source_page FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT uq_products_version_name UNIQUE (business_context_version_id, name),
    CONSTRAINT chk_products_confidence CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
    CONSTRAINT chk_products_url_format CHECK (url IS NULL OR url ~ '^https?://')
);

-- Table: services
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    business_context_version_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    url TEXT NULL,
    source_page_id UUID NULL,
    extraction_method public.extraction_method NOT NULL DEFAULT 'deterministic',
    confidence_score NUMERIC(3,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_services PRIMARY KEY (id),
    CONSTRAINT fk_services_version FOREIGN KEY (business_context_version_id) REFERENCES public.business_context_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_services_source_page FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT uq_services_version_name UNIQUE (business_context_version_id, name),
    CONSTRAINT chk_services_confidence CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
    CONSTRAINT chk_services_url_format CHECK (url IS NULL OR url ~ '^https?://')
);

-- Table: technologies
CREATE TABLE public.technologies (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NULL,
    source_page_id UUID NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_technologies PRIMARY KEY (id),
    CONSTRAINT fk_technologies_domain FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE,
    CONSTRAINT fk_technologies_source_page FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL,
    CONSTRAINT uq_technologies_domain_name UNIQUE (domain_id, name)
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_business_context_versions_project_id ON public.business_context_versions(project_id);
CREATE INDEX idx_business_context_versions_project_created ON public.business_context_versions(project_id, created_at DESC);
CREATE INDEX idx_entities_version_id ON public.entities(business_context_version_id);
CREATE INDEX idx_topics_version_id ON public.topics(business_context_version_id);
CREATE INDEX idx_products_version_id ON public.products(business_context_version_id);
CREATE INDEX idx_services_version_id ON public.services(business_context_version_id);
CREATE INDEX idx_technologies_domain_id ON public.technologies(domain_id);

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_technologies_set_updated_at
    BEFORE UPDATE ON public.technologies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

-- business_context_versions
ALTER TABLE public.business_context_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_context_versions_select_own ON public.business_context_versions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = business_context_versions.project_id AND p.user_id = auth.uid()));

CREATE POLICY business_context_versions_insert_own ON public.business_context_versions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = business_context_versions.project_id AND p.user_id = auth.uid()));

-- entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_select_own ON public.entities FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = entities.business_context_version_id AND p.user_id = auth.uid()));

CREATE POLICY entities_insert_own ON public.entities FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = entities.business_context_version_id AND p.user_id = auth.uid()));

-- topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY topics_select_own ON public.topics FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = topics.business_context_version_id AND p.user_id = auth.uid()));

CREATE POLICY topics_insert_own ON public.topics FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = topics.business_context_version_id AND p.user_id = auth.uid()));

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_own ON public.products FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = products.business_context_version_id AND p.user_id = auth.uid()));

CREATE POLICY products_insert_own ON public.products FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = products.business_context_version_id AND p.user_id = auth.uid()));

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_select_own ON public.services FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = services.business_context_version_id AND p.user_id = auth.uid()));

CREATE POLICY services_insert_own ON public.services FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.business_context_versions bcv JOIN public.projects p ON p.id = bcv.project_id WHERE bcv.id = services.business_context_version_id AND p.user_id = auth.uid()));

-- technologies
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY technologies_select_own ON public.technologies FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = technologies.domain_id AND p.user_id = auth.uid()));

CREATE POLICY technologies_insert_own ON public.technologies FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = technologies.domain_id AND p.user_id = auth.uid()));

CREATE POLICY technologies_update_own ON public.technologies FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = technologies.domain_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.domains d JOIN public.projects p ON p.id = d.project_id WHERE d.id = technologies.domain_id AND p.user_id = auth.uid()));
