## Why

The documents API depends on `StorageService` to generate presigned upload/download URLs and delete objects, but `app/api/src/storage/` contains only empty scaffolded files. Without a working `StorageModule`, document upload and download flows are blocked.

## What Changes

- Implement `StorageService` interface (`storage.interface.ts`) with the `createUploadUrl`, `createDownloadUrl`, `deleteObject`, and `objectExists` methods
- Implement `S3StorageService` (`s3-storage.service.ts`) using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Implement `StorageModule` (`storage.module.ts`) as a NestJS module that provides `S3StorageService` bound to the `StorageService` token, with environment-driven config
- Add MinIO to `docker-compose.yml` for local development
- Add required environment variables to `.env.example`

## Capabilities

### New Capabilities
- `storage`: S3-backed file storage behind an abstract `StorageService` interface, supporting presigned upload/download URLs, object existence checks, and object deletion

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Non-goals

- Implementing the abandoned-upload cleanup job (PENDING > 24h)
- NasStorageService or any non-S3 backend
- Wiring `StorageService` into `DocumentsModule` (that belongs in the documents change)
- S3 bucket creation or infrastructure provisioning

## Impact

- `app/api/src/storage/`: three files populated (`storage.interface.ts`, `s3-storage.service.ts`, `storage.module.ts`)
- `app/api/package.json`: new dependencies `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `docker-compose.yml`: MinIO service added
- `.env.example`: S3 environment variables added
