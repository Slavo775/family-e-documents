# Search Spec

## Overview
Full-text search across document title, description, and tags using PostgreSQL
`tsvector` + `pg_trgm` for fuzzy matching. All results are permission-filtered:
users only see documents from folders they can VIEW, respecting document
visibility rules.

---

## Search Index

A generated column (or maintained via trigger) keeps the search vector up to date:

```sql
-- Migration: add pg_trgm extension and search vector
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Document"
  ADD COLUMN "searchVector" tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('simple', array_to_string(tags, ' ')), 'A')
    ) STORED;

CREATE INDEX document_search_idx ON "Document" USING GIN ("searchVector");
CREATE INDEX document_trgm_title_idx ON "Document" USING GIN (title gin_trgm_ops);
CREATE INDEX document_trgm_desc_idx  ON "Document" USING GIN (description gin_trgm_ops);
```

Weights:
- `A` (highest): title + tags
- `B`: description

---

## API Contract

### GET /api/v1/search
```
Query params:
  q: string              // required, min 1 char, max 200 chars
  tags?: string[]        // filter: document must have ALL specified tags
  folderId?: string      // scope search to this folder and its descendants
  page?: number          // default 1
  limit?: number         // default 20, max 50

Response 200:
  {
    data: SearchResult[]
    total: number
    page: number
    limit: number
    query: string
  }

type SearchResult = {
  id: string
  name: string
  title: string
  description: string | null
  tags: string[]
  folderId: string
  folderName: string
  folderPath: string        // e.g. "Finance / Tax Returns"
  mimeType: string
  sizeBytes: number
  rank: number              // ts_rank score, for client-side display
  uploadedBy: { id: string; name: string }
  createdAt: string
}
```

---

## Query Strategy

```sql
-- Full-text + trigram combined (Prisma raw query)
SELECT
  d.*,
  ts_rank("searchVector", query) AS rank
FROM "Document" d,
     plainto_tsquery('simple', $1) query
WHERE
  d.status = 'ACTIVE'
  AND (
    "searchVector" @@ query
    OR title    % $1          -- trigram similarity for fuzzy match
    OR description % $1
  )
  AND d."folderId" IN (SELECT id FROM accessible_folders)   -- permission CTE
  AND (
    d.visibility = 'PUBLIC'
    OR $userId = ANY(d."allowedUserIds")
    OR $userRole = 'ADMIN'
  )
  AND ($tags::text[] IS NULL OR tags @> $tags::text[])
ORDER BY rank DESC, d."createdAt" DESC
LIMIT $limit OFFSET $offset;
```

The `accessible_folders` CTE is a recursive query that walks the folder tree
collecting folder IDs where the user has VIEW permission.

---

## Tag Autocomplete

### GET /api/v1/search/tags
```
Query params:
  q?: string     // prefix match, min 1 char
  limit?: number // default 20

Response 200: string[]
// Returns distinct tags from documents the user can view, ordered by frequency
```

---

## Business Rules

1. Search only returns ACTIVE documents.
2. Results are strictly filtered by:
   - Folder VIEW permission (recursive — includes nested folders)
   - Document visibility (RESTRICTED documents require userId in allowedUserIds)
3. Minimum query length: 1 character. Trigram index activates at 3+ characters
   (pg_trgm default similarity threshold 0.3).
4. Tags filter uses array containment (`@>`) — all specified tags must be present.
5. Tags filter and full-text query can be combined.
6. `folderId` scope restricts search to that folder and all its descendants.
7. ADMIN sees all ACTIVE documents regardless of visibility.
8. Empty result set returns 200 with `data: []`, not 404.
9. The `q` parameter is sanitised (stripped of SQL wildcards) before being
   passed to `plainto_tsquery` (which handles this internally, but the API
   layer still validates max length and trims whitespace).
