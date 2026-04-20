## 1. Dependencies

- [x] 1.1 Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to `app/api/package.json`
- [x] 1.2 Run `pnpm install` to install new dependencies

## 2. StorageService Interface

- [x] 2.1 Populate `app/api/src/storage/storage.interface.ts` with the `StorageService` interface and `STORAGE_SERVICE` injection token constant

## 3. S3StorageService Implementation

- [x] 3.1 Populate `app/api/src/storage/s3-storage.service.ts` with `S3StorageService` class implementing `StorageService`
- [x] 3.2 Implement `createUploadUrl`: generate presigned PUT URL with TTL from `UPLOAD_URL_TTL_SECONDS`, object key `documents/{documentId}/{filename}`, and 500 MB max-size condition
- [x] 3.3 Implement MIME type allowlist validation in `createUploadUrl` (PDF, DOCX, XLSX, PPTX, ODT, ODS, ODP, JPEG, PNG, WebP, GIF, plain text, CSV)
- [x] 3.4 Implement `createDownloadUrl`: generate presigned GET URL with `Content-Disposition` header and TTL from `DOWNLOAD_URL_TTL_SECONDS`
- [x] 3.5 Implement `objectExists`: use `HeadObjectCommand`; return `false` on `NotFound`, `true` on success
- [x] 3.6 Implement `deleteObject`: use `DeleteObjectCommand`; log errors but do not throw
- [x] 3.7 Wire `ConfigService` for bucket, region, endpoint, access key, secret key; support `S3_ENDPOINT` path-style override for MinIO

## 4. StorageModule

- [x] 4.1 Populate `app/api/src/storage/storage.module.ts` with `StorageModule` providing `S3StorageService` under the `'STORAGE_SERVICE'` token and exporting it

## 5. Environment Configuration

- [x] 5.1 Add S3 environment variables to `app/api/.env.example` (`S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `UPLOAD_URL_TTL_SECONDS`, `DOWNLOAD_URL_TTL_SECONDS`)
- [x] 5.2 Add MinIO service to `docker-compose.yml` (image `minio/minio`, ports 9000/9001, default credentials)

## 6. AppModule Wiring

- [x] 6.1 Import `StorageModule` into `app/api/src/app.module.ts`

## 7. Verification

- [x] 7.1 Run `pnpm --filter @family-docs/api typecheck` and confirm zero errors
