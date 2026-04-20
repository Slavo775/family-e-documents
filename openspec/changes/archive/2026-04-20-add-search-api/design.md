## Context

The family document explorer currently has no search capability. Users must browse the folder tree to find documents. The search spec (`openspec/specs/search/spec.md`) is fully defined; this change implements it.

The backend is NestJS + Prisma + PostgreSQL. Prisma's ORM does not support `tsvector` or `pg_trgm` natively, so the query must use `$queryRaw`. Permission filtering reuses the same recursive CTE pattern established by the permissions spec.

## Goals / Non-Goals

**Goals:**
- Implement `GET /api/v1/search` with full-text + fuzzy search, permission filtering, tag filter, and folder scoping
- Implement `GET /api/v1/search/tags` for tag autocomplete
- Add Prisma migration for `pg_trgm` extension, `searchVector` generated column, and GIN indexes

**Non-Goals:**
- Frontend search UI (separate change)
- Search result highlighting / snippet extraction
- Query analytics or search history
- External search engines (Elasticsearch, Meilisearch)

## Decisions

### 1. Raw Prisma query (`$queryRaw`) over ORM

Prisma does not support `tsvector @@ tsquery`, `ts_rank`, or trigram operators. A raw SQL query is the only option. The query is parameterised (`$1`, `$2`, …) to prevent injection; `plainto_tsquery` handles internal sanitisation of the search term.

**Alternatives considered:**
- ORM `findMany` with post-filter in TypeScript — rejected: cannot use GIN index, all docs would be loaded into memory
- External search engine — rejected: operational overhead not justified for a self-hosted family tool

### 2. Generated column for `searchVector`

`searchVector tsvector GENERATED ALWAYS AS (...) STORED` keeps the index automatically in sync with `title`, `description`, and `tags` on every write. No trigger maintenance required.

**Alternatives considered:**
- Application-level update on every document write — rejected: fragile (missed updates on bulk imports or direct DB edits)
- Trigger-maintained column — rejected: more complex migration; generated column achieves the same result with less code

### 3. Recursive CTE for accessible folders

The permission check walks the folder tree via a `WITH RECURSIVE` CTE, collecting all folder IDs where the requesting user has VIEW permission. This is the same strategy used in the permissions module and avoids N+1 queries.

**Alternatives considered:**
- Materialised folder permission table — deferred: premature optimisation for current dataset size
- Application-level folder ID list passed into query — rejected: can exceed parameter limits for deep trees

### 4. `SearchModule` as a standalone NestJS module

Search is independent of `DocumentsModule` and `FoldersModule` at the module level, but uses `PrismaService` directly. It does not import Document or Folder services to avoid circular dependencies.

## Risks / Trade-offs

- **Cold query performance on large datasets** → GIN indexes + recursive CTE can be slow without query planner hints on very large tables. Acceptable for a family-scale deployment; revisit if dataset grows beyond ~100k documents.
- **`pg_trgm` only activates at 3+ characters** → Queries of 1–2 characters return only full-text matches (no fuzzy). Documented in business rules; acceptable behaviour.
- **`$queryRaw` bypasses Prisma type safety** → Result rows are typed manually. A Zod schema validates the raw rows before returning to the controller.
- **Generated column requires PostgreSQL 12+** → Acceptable; project already requires PostgreSQL 14+ for other features.

## Migration Plan

1. Deploy migration: `pg_trgm` extension + `searchVector` generated column + GIN indexes
   - Migration is additive; no data loss; safe to run on live database
   - `searchVector` is populated automatically by Postgres for all existing rows during `ALTER TABLE`
   - Index build may take several seconds on a large table — acceptable for family scale
2. Deploy new `SearchModule` code
3. Rollback: drop the generated column and indexes, remove the `SearchModule` (no other modules depend on it)

## Open Questions

- None — spec is fully defined and requirements are unambiguous
