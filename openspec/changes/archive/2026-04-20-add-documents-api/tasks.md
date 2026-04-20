## 1. Shared Types

- [x] 1.1 Add `DocumentPublic` interface to `packages/types/src/dtos.ts`
- [x] 1.2 Add `CreateDocumentDto` interface to `packages/types/src/dtos.ts` (name, title, description?, tags?, folderId, mimeType, sizeBytes)
- [x] 1.3 Add `UpdateDocumentDto` interface to `packages/types/src/dtos.ts` (all fields optional: name, title, description, tags, visibility, allowedUserIds)
- [x] 1.4 Add `DocumentListResponse` interface to `packages/types/src/dtos.ts` (data, total, page, limit)
- [x] 1.5 Add `UploadInitResponse` interface to `packages/types/src/dtos.ts` (documentId, uploadUrl, uploadExpiresAt)
- [x] 1.6 Rebuild `packages/types` (`pnpm build` in packages/types)

## 2. StorageModule

- [x] 2.1 Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `app/api`
- [x] 2.2 Create `app/api/src/storage/storage.interface.ts` defining the `StorageService` interface (createUploadUrl, createDownloadUrl, deleteObject, objectExists)
- [x] 2.3 Create `app/api/src/storage/s3-storage.service.ts` implementing `StorageService` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
  - Object key pattern: `documents/{documentId}/{filename}`
  - Read `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (optional), `UPLOAD_URL_TTL_SECONDS`, `DOWNLOAD_URL_TTL_SECONDS` from `ConfigService`
  - `createUploadUrl`: `PutObjectCommand` with `ContentType` and `ContentLength` conditions
  - `createDownloadUrl`: `GetObjectCommand` with `ResponseContentDisposition` header
  - `objectExists`: `HeadObjectCommand`, return false on `NoSuchKey`
  - `deleteObject`: `DeleteObjectCommand`, swallow `NoSuchKey`
- [x] 2.4 Create `app/api/src/storage/storage.module.ts` as `@Global()`, providing `S3StorageService` and exporting it via `STORAGE_SERVICE` injection token
- [x] 2.5 Add `STORAGE_SERVICE` injection token constant to `app/api/src/storage/storage.interface.ts`
- [x] 2.6 Add S3 env vars to `app/api/.env.example` (`S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `UPLOAD_URL_TTL_SECONDS`, `DOWNLOAD_URL_TTL_SECONDS`)

## 3. PermissionsModule

- [x] 3.1 Create `app/api/src/permissions/permissions.service.ts` with:
  - `canPerformAction(userId: string, folderId: string, action: FolderAction, userRole: Role): Promise<boolean>` — implements 3-layer resolution (ADMIN short-circuit → folder permission with tree walk-up → fall back to USER baseline)
  - `canViewDocument(userId: string, userRole: Role, document: { folderId: string; visibility: string; allowedUserIds: string[] }): Promise<boolean>` — calls `canPerformAction(VIEW)` then checks visibility
- [x] 3.2 Create `app/api/src/permissions/permissions.module.ts` as `@Global()`, providing and exporting `PermissionsService`
- [x] 3.3 Import `PermissionsModule` in `AppModule`

## 4. DocumentsModule — Core

- [x] 4.1 Create `app/api/src/documents/documents.service.ts` injecting `PrismaService`, `StorageService` (via token), `PermissionsService`
- [x] 4.2 Implement `initiateUpload(userId, dto): Promise<UploadInitResponse>`
- [x] 4.3 Implement `confirmUpload(userId, documentId): Promise<DocumentPublic>`
- [x] 4.4 Implement `findAll(userId, userRole, query): Promise<DocumentListResponse>`
- [x] 4.5 Implement `findOne(userId, userRole, documentId): Promise<DocumentPublic>`
- [x] 4.6 Implement `getDownloadUrl(userId, userRole, documentId)`
- [x] 4.7 Implement `updateMetadata(userId, userRole, documentId, dto): Promise<DocumentPublic>`
- [x] 4.8 Implement `moveDocument(userId, userRole, documentId, targetFolderId): Promise<DocumentPublic>`
- [x] 4.9 Implement `softDelete(userId, userRole, documentId): Promise<void>`
- [x] 4.10 Add `toDocumentPublic` helper

## 5. DocumentsModule — Controller & Module

- [x] 5.1 Create `app/api/src/documents/documents.controller.ts` with all 7 routes
- [x] 5.2 Apply `@UseGuards(BearerTokenGuard)` globally on the controller
- [x] 5.3 Add request-body DTOs with `class-validator` decorators for each endpoint
- [x] 5.4 Add query-param DTO for `GET /api/v1/documents`
- [x] 5.5 Create `app/api/src/documents/documents.module.ts` importing `AuthModule`
- [x] 5.6 Import `DocumentsModule` and `StorageModule` and `PermissionsModule` in `AppModule`

## 6. TypeScript Check & Build

- [x] 6.1 Run `npx tsc --noEmit` in `app/api` — fix any type errors
- [x] 6.2 Run `pnpm build` in `app/api` — confirm clean build

## 7. Verification

- [ ] 7.1 `POST /api/v1/documents` — confirm 201 + presigned URL returned and DB row with status=PENDING
- [ ] 7.2 `POST /api/v1/documents/:id/confirm` without uploading to S3 — confirm 400 "File not found in storage"
- [ ] 7.3 `GET /api/v1/documents` — confirm only ACTIVE documents returned, pagination applied
- [ ] 7.4 `GET /api/v1/documents/:id` — confirm 403 for RESTRICTED document when user not in allowedUserIds
- [ ] 7.5 `GET /api/v1/documents/:id/download` — confirm presigned URL returned for authorised user
- [ ] 7.6 `PATCH /api/v1/documents/:id` — confirm 403 when not owner; 400 when setting RESTRICTED without canRestrictDocs
- [ ] 7.7 `POST /api/v1/documents/:id/move` — confirm 403 when lacking DELETE on source
- [ ] 7.8 `DELETE /api/v1/documents/:id` — confirm 204 and document excluded from subsequent GET
