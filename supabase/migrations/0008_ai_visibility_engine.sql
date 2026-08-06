-- Migration: 0008_ai_visibility_engine.sql
-- Description: Creates AI Visibility Engine schema (providers, prompt_library, ai_scans, citations), triggers, seed data, and RLS policies.
-- Idempotent: Safe to execute on fresh schema following 0007_business_context.sql.

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.scan_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'neutral', 'negative');

-- -----------------------------------------------------------------------------
-- 2. TABLES & CONSTRAINTS
-- -----------------------------------------------------------------------------

-- Table: providers
CREATE TABLE public.providers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_providers PRIMARY KEY (id),
    CONSTRAINT uq_providers_slug UNIQUE (slug)
);

-- Table: prompt_library
CREATE TABLE public.prompt_library (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    prompt_text TEXT NOT NULL,
    category VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_prompt_library PRIMARY KEY (id),
    CONSTRAINT fk_prompt_library_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_prompt_library_project_text UNIQUE (project_id, prompt_text)
);

-- Table: ai_scans
CREATE TABLE public.ai_scans (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    business_context_version_id UUID NULL,
    prompt_library_id UUID NULL,
    prompt_text TEXT NOT NULL,
    status public.scan_status NOT NULL DEFAULT 'queued',
    model_name VARCHAR(100) NULL,
    raw_response TEXT NULL,
    response_json JSONB NULL,
    is_mentioned BOOLEAN NULL,
    mention_position INTEGER NULL,
    sentiment public.sentiment_type NULL,
    summary_markdown TEXT NULL,
    api_latency_ms INTEGER NULL,
    input_tokens INTEGER NULL,
    output_tokens INTEGER NULL,
    estimated_cost NUMERIC(10,6) NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_ai_scans PRIMARY KEY (id),
    CONSTRAINT fk_ai_scans_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_scans_provider FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_scans_context_version FOREIGN KEY (business_context_version_id) REFERENCES public.business_context_versions(id) ON DELETE SET NULL,
    CONSTRAINT fk_ai_scans_prompt_library FOREIGN KEY (prompt_library_id) REFERENCES public.prompt_library(id) ON DELETE SET NULL,
    CONSTRAINT chk_ai_scans_mention_position CHECK (mention_position IS NULL OR mention_position >= 0),
    CONSTRAINT chk_ai_scans_latency CHECK (api_latency_ms IS NULL OR api_latency_ms >= 0),
    CONSTRAINT chk_ai_scans_input_tokens CHECK (input_tokens IS NULL OR input_tokens >= 0),
    CONSTRAINT chk_ai_scans_output_tokens CHECK (output_tokens IS NULL OR output_tokens >= 0),
    CONSTRAINT chk_ai_scans_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
);

-- Table: citations
CREATE TABLE public.citations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    ai_scan_id UUID NOT NULL,
    url TEXT NOT NULL,
    title TEXT NULL,
    position INTEGER NOT NULL,
    is_own_domain BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_citations PRIMARY KEY (id),
    CONSTRAINT fk_citations_scan FOREIGN KEY (ai_scan_id) REFERENCES public.ai_scans(id) ON DELETE CASCADE,
    CONSTRAINT uq_citations_scan_position UNIQUE (ai_scan_id, position),
    CONSTRAINT chk_citations_url_format CHECK (url ~ '^https?://'),
    CONSTRAINT chk_citations_position CHECK (position > 0)
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_prompt_library_project_id ON public.prompt_library(project_id);
CREATE INDEX idx_ai_scans_project_id ON public.ai_scans(project_id);
CREATE INDEX idx_ai_scans_provider_id ON public.ai_scans(provider_id);
CREATE INDEX idx_ai_scans_status ON public.ai_scans(status);
CREATE INDEX idx_ai_scans_context_version_id ON public.ai_scans(business_context_version_id);
CREATE INDEX idx_citations_scan_id ON public.citations(ai_scan_id);
CREATE INDEX idx_citations_own_domain ON public.citations(ai_scan_id, is_own_domain) WHERE is_own_domain = TRUE;

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS & SEED DATA
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_providers_set_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_prompt_library_set_updated_at
    BEFORE UPDATE ON public.prompt_library
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ai_scans_set_updated_at
    BEFORE UPDATE ON public.ai_scans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed LLM Providers
INSERT INTO public.providers (slug, display_name, is_active) VALUES
    ('gemini', 'Google Gemini', TRUE),
    ('chatgpt', 'ChatGPT', FALSE),
    ('perplexity', 'Perplexity', FALSE),
    ('claude', 'Claude', FALSE),
    ('deepseek', 'DeepSeek', FALSE),
    ('grok', 'Grok', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- -----------------------------------------------------------------------------

-- providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY providers_select_all ON public.providers FOR SELECT
    USING (true);

-- prompt_library
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompt_library_select_own ON public.prompt_library FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = prompt_library.project_id AND p.user_id = auth.uid()));

CREATE POLICY prompt_library_insert_own ON public.prompt_library FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = prompt_library.project_id AND p.user_id = auth.uid()));

CREATE POLICY prompt_library_update_own ON public.prompt_library FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = prompt_library.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = prompt_library.project_id AND p.user_id = auth.uid()));

-- ai_scans
ALTER TABLE public.ai_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_scans_select_own ON public.ai_scans FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = ai_scans.project_id AND p.user_id = auth.uid()));

CREATE POLICY ai_scans_insert_own ON public.ai_scans FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = ai_scans.project_id AND p.user_id = auth.uid()));

CREATE POLICY ai_scans_update_own ON public.ai_scans FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = ai_scans.project_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = ai_scans.project_id AND p.user_id = auth.uid()));

-- citations
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY citations_select_own ON public.citations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.ai_scans s JOIN public.projects p ON p.id = s.project_id WHERE s.id = citations.ai_scan_id AND p.user_id = auth.uid()));

CREATE POLICY citations_insert_own ON public.citations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.ai_scans s JOIN public.projects p ON p.id = s.project_id WHERE s.id = citations.ai_scan_id AND p.user_id = auth.uid()));
