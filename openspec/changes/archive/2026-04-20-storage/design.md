## Context

`app/api/src/storage/` has three empty scaffold files:
- `storage.interface.ts` — `StorageService` interface (to be filled)
- `s3-storage.service.ts` — concrete AWS S3 implementation (to be filled)
- `storage.module.ts` — NestJS module with DI wiring (to be filled)

The `DocumentsModule` (already scaffolded) will import `StorageModule` to generate presigned URLs and delete objects. The abstraction layer allows swapping S3 for NAS without touching any other module.

## Goals / Non-Goals

**Goals:**
- Define the `StorageService` TypeScript interface
- Implement `S3StorageService` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Wire up `StorageModule` with NestJS `ConfigService` for environment-driven credentials
- Support MinIO for local dev via `S3_ENDPOINT` override
- Document required env vars in `.env.example`
- Add MinIO to `docker-compose.yml`

**Non-Goals:**
- Abandoned-upload cleanup (scheduled job, separate change)
- `NasStorageService` implementation
- Integrating `StorageModule` into `DocumentsModule` (separate concern)
- S3 CORS or bucket policy configuration

## Decisions

### Decision: Injection token string constant, not class reference

`StorageModule` provides `S3StorageService` under a string token `'STORAGE_SERVICE'` (exported from the interface file), not using the class directly as token. This decouples consumers from the concrete implementation — any other module can inject via `@Inject('STORAGE_SERVICE')` without importing `S3StorageService`.

**Alternative**: Use the interface type as an abstract class token. Rejected — TypeScript interfaces are erased at runtime; a string constant is simpler and explicit.

### Decision: NestJS `ConfigService` for credentials, not `process.env` directly

`S3StorageService` receives config through NestJS `ConfigService` (already available via `ConfigModule.forRoot({ isGlobal: true })`). This enables validation at startup and avoids scattered `process.env` reads.

**Alternative**: Read `process.env` directly in the service constructor. Rejected — bypasses NestJS bootstrap validation and makes unit testing harder.

### Decision: Object key format `documents/{documentId}/{originalFilename}`

Deterministic key from `documentId` (generated before upload) means we can derive the key at any point without a DB lookup. One object per document, no versioning in v1.

### Decision: `S3_ENDPOINT` optional override for MinIO

When `S3_ENDPOINT` is set, the `S3Client` uses it as `endpoint` with `forcePathStyle: true` (required for MinIO). When absent, the standard AWS regional endpoint is used. This keeps the same code path for local and production.

## Risks / Trade-offs

- **Presigned URL expiry** → Upload URLs expire in 15 min (configurable via `UPLOAD_URL_TTL_SECONDS`). If the browser is slow, the upload fails silently. Mitigation: the client should show an expiry countdown; this is a frontend concern.
- **`objectExists` after confirm** → `HeadObject` is eventually consistent on S3 in rare cases. Mitigation: retry once after 1s before failing the confirm step. This is noted as an implementation detail in `S3StorageService`.
- **Orphaned objects on delete failure** → `deleteObject` logs but does not throw on S3 failure, so the DB record is deleted but the object may linger. Mitigation: reconciliation job (out of scope for this change).
- **MinIO not prod-identical** → MinIO is S3-compatible but has subtle differences (e.g., multipart upload behaviour). Mitigation: integration tests should run against real AWS in CI.

## Migration Plan

1. Install AWS SDK packages in `app/api`
2. Populate the three storage files
3. Add env vars to `.env.example`
4. Add MinIO service to `docker-compose.yml`
5. Import `StorageModule` into `AppModule` (or leave for `DocumentsModule` to import as needed)
6. Run `pnpm --filter @family-docs/api typecheck` to verify
