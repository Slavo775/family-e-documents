## Context

The `Document` model and `DocumentStatus`/`Visibility` enums are already in the Prisma schema and database. The `StorageService` interface and upload/download flow are specified in the storage spec. The permission resolution algorithm (3-layer: role → folder permission → visibility) is fully defined in the permissions spec.

This change wires everything together: a NestJS `DocumentsModule` that implements all seven document endpoints using the existing DB schema, an `S3StorageService` implementing the `StorageService` interface, and a `PermissionsService` that executes the resolution algorithm for access checks.

## Goals / Non-Goals

**Goals:**
- Implement all seven document API endpoints per spec
- Implement `StorageService` / `S3StorageService` with presigned URL generation
- Implement `PermissionsService` for the 3-layer resolution algorithm
- Enforce all permission and visibility checks on every endpoint
- Return `DocumentPublic` shape on all document responses
- Soft-delete only (status = DELETED); no hard DB deletes

**Non-Goals:**
- Full-text search indexing (separate change)
- S3 cleanup job for soft-deleted documents
- Abandoned upload (PENDING > 24h) cleanup job
- Frontend UI
- Folder management API (separate change)

## Decisions

### StorageModule as a global provider

**Decision**: `StorageModule` is `@Global()` and exports `StorageService` via an injection token (`STORAGE_SERVICE`). The concrete binding is `S3StorageService`.

**Why**: Multiple future modules (documents, search, admin cleanup) will need storage access. A global module avoids re-importing `StorageModule` everywhere, consistent with how `PrismaModule` is handled.

**Alternative considered**: Provide `StorageService` directly inside `DocumentsModule` — rejected because it couples storage to documents and makes the planned NAS swap more invasive.

---

### PermissionsService as a shared service

**Decision**: `PermissionsService` lives in a `PermissionsModule` (global), implementing the 3-layer resolution algorithm as `canPerformAction(userId, folderId, action): Promise<boolean>` and `canViewDocument(userId, document): Promise<boolean>`.

**Why**: Permission checks are needed by documents, folders, and future search scoping. Centralising in a shared module avoids duplicating the walk-up-tree logic and keeps the algorithm testable in isolation.

---

### Upload confirmation verifies S3 existence

**Decision**: `POST /documents/:id/confirm` calls `StorageService.objectExists(objectKey)` before marking the document ACTIVE.

**Why**: Without verification the API would mark documents ACTIVE even if the client's S3 PUT failed silently. The S3 `HeadObject` call is cheap and prevents phantom documents.

**Risk**: If S3 is temporarily unavailable, legitimate confirms fail. Mitigation: clients retry; the document stays PENDING and does not disappear.

---

### Soft-delete only; S3 cleanup is async

**Decision**: `DELETE /documents/:id` sets `status = DELETED` in the DB. S3 object deletion is attempted immediately (best-effort) but failure does NOT block the DB update.

**Why**: Hard-deleting the S3 object synchronously risks a situation where the DB row is gone but the S3 object remains (if the S3 call succeeds but the DB call fails). Soft-delete + async cleanup is safer and allows recovery. Orphaned objects are cleaned by a future reconciliation job.

---

### Name uniqueness is case-insensitive within a folder

**Decision**: Checked at the service layer with a Prisma query: `findFirst({ where: { folderId, name: { equals: name, mode: 'insensitive' } } })`.

**Why**: The spec requires case-insensitive uniqueness. Postgres `citext` would be cleaner but adds a DB extension; the Prisma `mode: 'insensitive'` approach uses `ILIKE` under the hood and requires no schema migration.

---

### Move requires DELETE on source + UPLOAD on target

**Decision**: Both checks run before the move; if either fails, return 403.

**Why**: Matches the spec exactly. "DELETE on source" prevents unauthorised users from moving documents out of folders they cannot delete from. "UPLOAD on target" prevents dropping files into folders the user cannot write to.

---

### DocumentPublic excludes S3 file key

**Decision**: `fileKey` (the S3 object key) is never exposed in `DocumentPublic`.

**Why**: Leaking the object key would let clients construct paths into the bucket even without a presigned URL. All file access goes through the `/download` endpoint.

---

### Tags validation at service layer

**Decision**: Tags are validated before persistence: lowercase-trimmed, max 32 chars each, max 20 per document. Invalid tags return 400.

**Why**: The DB stores `String[]` with no constraints. Validation must be explicit. Lowercasing at write time simplifies search/filter later.

## Risks / Trade-offs

- **`objectExists` race condition**: An upload URL expires but the client still manages to PUT. Confirm runs `objectExists` → returns true. The URL TTL (15 min) is short enough that this is acceptable.
- **PENDING documents accumulate**: Without the cleanup job, PENDING rows pile up. Mitigation: the job is a known follow-on task; PENDING documents are invisible to all users except the uploader and ADMIN.
- **Folder permission walk-up is O(depth)**: Resolving inherited permissions requires walking up the folder tree. For the expected 3–5 level depth in a family app this is negligible; if depth grows, add a materialised path column.
- **S3 orphan on partial delete**: If DB soft-delete succeeds but S3 delete fails, the object is orphaned. Mitigation: best-effort + reconciliation job (out of scope here).

## Migration Plan

1. No new Prisma migration needed — `Document` model is already in schema.
2. Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to `app/api`.
3. Add required env vars to `.env.example` (`S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `UPLOAD_URL_TTL_SECONDS`, `DOWNLOAD_URL_TTL_SECONDS`).
4. Deploy API — new routes become active immediately.
5. **Rollback**: remove `DocumentsModule`, `StorageModule`, `PermissionsModule` imports from `AppModule`. No DB schema to roll back.
