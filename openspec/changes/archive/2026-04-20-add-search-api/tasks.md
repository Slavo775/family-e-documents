## 1. Shared Types

- [x] 1.1 Add `SearchResultDto` type to `packages/types` (id, name, title, description, tags, folderId, folderName, folderPath, mimeType, sizeBytes, rank, uploadedBy, createdAt)
- [x] 1.2 Add `SearchQueryDto` Zod schema to `packages/types` (q, tags, folderId, page, limit with validation rules)
- [x] 1.3 Add `SearchTagsQueryDto` Zod schema to `packages/types` (q optional, limit)
- [x] 1.4 Export new types from `packages/types` index

## 2. Database Migration

- [x] 2.1 Create Prisma migration: enable `pg_trgm` extension (`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
- [x] 2.2 Add `searchVector tsvector GENERATED ALWAYS AS (...)  STORED` column to `Document` table in migration
- [x] 2.3 Add GIN index `document_search_idx` on `Document."searchVector"` in migration
- [x] 2.4 Add GIN trigram index `document_trgm_title_idx` on `Document.title` in migration
- [x] 2.5 Add GIN trigram index `document_trgm_desc_idx` on `Document.description` in migration
- [ ] 2.6 Run migration against dev database and verify indexes with `\d "Document"`

## 3. Search Module — Backend

- [x] 3.1 Scaffold `SearchModule`, `SearchController`, `SearchService` under `app/api/src/search/`
- [x] 3.2 Register `SearchModule` in `AppModule`
- [x] 3.3 Implement `SearchService.search(userId, role, query)`: build accessible-folders recursive CTE, construct parameterised `$queryRaw` with full-text + trigram match, permission filter, tag filter, folder scope, pagination
- [x] 3.4 Implement `SearchService.getTags(userId, role, q, limit)`: query distinct tags from accessible ACTIVE documents matching optional prefix, ordered by frequency
- [x] 3.5 Validate raw query result rows with Zod before returning from service (type safety for `$queryRaw`)
- [x] 3.6 Implement `SearchController.search` — `GET /api/v1/search`, validate query params with `SearchQueryDto`, call service, return paginated response
- [x] 3.7 Implement `SearchController.getTags` — `GET /api/v1/search/tags`, validate query params with `SearchTagsQueryDto`, return `string[]`
- [x] 3.8 Add Swagger `@ApiOperation`, `@ApiQuery`, `@ApiResponse` decorators to controller

## 4. Validation & Edge Cases

- [x] 4.1 Verify 400 is returned when `q` is missing or empty string
- [x] 4.2 Verify 400 is returned when `q` exceeds 200 characters
- [x] 4.3 Verify 400 is returned when `limit > 50`
- [x] 4.4 Verify 200 with `data: []` when search returns no results
- [x] 4.5 Verify unauthenticated request to `/search` and `/search/tags` returns 401

## 5. Manual Integration Testing

- [ ] 5.1 Seed test documents with varied titles, descriptions, tags across folders with different permissions
- [ ] 5.2 Test full-text match (exact word in title)
- [ ] 5.3 Test trigram fuzzy match (misspelled title, 3+ char query)
- [ ] 5.4 Test tag filter narrows results correctly
- [ ] 5.5 Test folderId scope limits results to subtree
- [ ] 5.6 Test ADMIN sees all documents; USER sees only permitted documents
- [ ] 5.7 Test RESTRICTED document hidden from non-allowlisted USER
- [ ] 5.8 Test `/search/tags?q=<prefix>` returns frequency-ordered prefix matches
