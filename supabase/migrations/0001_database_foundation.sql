-- Migration: 0001_database_foundation.sql
-- Description: Establishes extensions, helper functions, and global database conventions.
-- Idempotent: Safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------

-- pgcrypto: Provides cryptographic functions including gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- pg_trgm: Supports trigram matching for text similarity search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- unaccent: Text search dictionary removing accents (diacritics)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function: update_updated_at_column()
-- Purpose: Sets NEW.updated_at = now() before every UPDATE execution.
-- Reusable trigger template:
--   CREATE TRIGGER trg_<table>_set_updated_at
--     BEFORE UPDATE ON public.<table>
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
