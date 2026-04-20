## Why

Documents are the core entity of the app, yet the API has no endpoints for managing them. Users currently cannot upload, retrieve, update, or delete files — the entire document workflow from presigned upload through to download is missing.

## What Changes

- Add `DocumentsModule` to the NestJS API with full CRUD + upload workflow
- Implement the presigned-upload pattern: POST metadata → receive S3 URL → client uploads directly → POST confirm to activate
- Add presigned download URL generation
- Add soft-delete (status = DELETED) — no hard deletes from the application
- Add move-to-folder endpoint (requires DELETE on source + UPLOAD on target)
- Add metadata patch (name, title, description, tags, visibility, allowedUserIds)
- Add paginated list endpoint with folder filter, respecting permission + visibility resolution
- Add `DocumentPublic` response DTO and related types to `packages/types`
- Add `StorageService` abstraction over S3 (presigned PUT + GET URL generation)

## Capabilities

### New Capabilities

- `documents`: Full document lifecycle — upload initiation, confirmation, retrieval, download, metadata update, move, and soft-delete. Covers the `DocumentsModule`, `StorageService`, all seven API endpoints, permission enforcement, and the `DocumentPublic` DTO.

### Modified Capabilities

<!-- No existing capability requirements are changing. -->

## Non-goals

- Search / full-text indexing (covered by the `search` spec — separate change)
- Hard delete or S3 cleanup (retention is async / out of app scope)
- Frontend UI for document management
- Bulk upload or multi-file operations
- Document versioning

## Impact

- **API**: new `DocumentsModule` with `DocumentsController`, `DocumentsService`, `StorageService`
- **packages/types**: `DocumentPublic`, `CreateDocumentDto`, `UpdateDocumentDto`, `DocumentListResponse`
- **Database**: schema already has the `Document` model — no new migration needed
- **S3**: requires `AWS_REGION`, `AWS_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` env vars
- **Dependencies**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
