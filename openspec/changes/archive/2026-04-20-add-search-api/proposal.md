## Why

Users have no way to find documents without manually browsing the folder tree. Full-text search with fuzzy matching and tag filtering is needed to make the document library usable as it grows.

## What Changes

- Add `GET /api/v1/search` endpoint: full-text + trigram search across document title, description, and tags, scoped to folders the requesting user can VIEW
- Add `GET /api/v1/search/tags` endpoint: tag autocomplete returning distinct tags from accessible documents
- Add PostgreSQL search infrastructure: `pg_trgm` extension, `searchVector` generated column on `Document`, GIN indexes for both full-text and trigram matching
- Results are permission-filtered via a recursive CTE over the folder tree; RESTRICTED documents require explicit `allowedUserIds` membership (ADMIN bypasses)

## Capabilities

### New Capabilities

- `search`: Full-text and fuzzy document search with tag filtering, folder scoping, and permission-aware result filtering

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- **Backend** (`app/api`): new `SearchModule` with controller + service; raw Prisma query using `plainto_tsquery` + `pg_trgm`; new Prisma migration for extension, generated column, and GIN indexes
- **Shared types** (`packages/types`): `SearchResult` DTO, query param schema
- **Database**: migration adds `pg_trgm` extension, `searchVector` tsvector column on `Document`, three GIN indexes
- **No frontend changes** in this change

## Non-goals

- UI search bar / frontend integration (separate change)
- Search analytics or query logging beyond the existing audit middleware
- Elasticsearch or any external search engine — PostgreSQL only
