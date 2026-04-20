-- Enable pg_trgm extension for trigram fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add full-text search vector as a generated column (PostgreSQL 12+)
-- Weights: title=A (highest), tags=A, description=B
ALTER TABLE "documents"
  ADD COLUMN "searchVector" tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('simple', array_to_string(tags, ' ')), 'A')
    ) STORED;

-- GIN index for full-text search
CREATE INDEX document_search_idx ON "documents" USING GIN ("searchVector");

-- GIN trigram indexes for fuzzy matching on title and description
CREATE INDEX document_trgm_title_idx ON "documents" USING GIN (title gin_trgm_ops);
CREATE INDEX document_trgm_desc_idx  ON "documents" USING GIN (description gin_trgm_ops);
