# Storage Spec

## Overview
File storage uses the presigned URL pattern against S3-compatible object storage.
The storage implementation is hidden behind a `StorageService` interface so the
backend can be swapped to NAS or another provider without touching business logic.

---

## StorageService Interface

```ts
interface StorageService {
  /**
   * Generate a presigned PUT URL for direct browser upload.
   * Returns the object key and the upload URL.
   */
  createUploadUrl(params: {
    documentId: string
    mimeType: string
    sizeBytes: number
  }): Promise<{ objectKey: string; uploadUrl: string; expiresAt: Date }>

  /**
   * Generate a presigned GET URL for temporary download access.
   */
  createDownloadUrl(params: {
    objectKey: string
    filename: string       // used as Content-Disposition header
    ttlSeconds?: number    // default 3600
  }): Promise<{ downloadUrl: string; expiresAt: Date }>

  /**
   * Permanently delete an object.
   */
  deleteObject(objectKey: string): Promise<void>

  /**
   * Check an object exists (used after upload confirmation).
   */
  objectExists(objectKey: string): Promise<boolean>
}
```

The concrete `S3StorageService` implements this interface using `@aws-sdk/client-s3`
and `@aws-sdk/s3-request-presigner`.

---

## Object Key Convention

```
documents/{documentId}/{originalFilename}

Example:
  documents/cm3abc123/tax-return-2024.pdf
```

- `documentId` is generated before upload so the key is deterministic.
- One object per document — no versioning in v1.

---

## Configuration

Environment variables consumed by `S3StorageService`:

```
S3_BUCKET=family-docs-bucket
S3_REGION=eu-central-1
S3_ENDPOINT=          # optional: override for MinIO / local dev
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
UPLOAD_URL_TTL_SECONDS=900     # 15 min default for upload URLs
DOWNLOAD_URL_TTL_SECONDS=3600  # 1 hr default for download URLs
```

---

## Upload Flow (detailed)

```
1. POST /api/v1/documents (metadata)
   ├─ API validates metadata
   ├─ API generates documentId (cuid2)
   ├─ StorageService.createUploadUrl({ documentId, mimeType, sizeBytes })
   ├─ API creates Document record with status=PENDING
   └─ Returns { documentId, uploadUrl, uploadExpiresAt }

2. Browser PUTs file directly to S3
   ├─ Content-Type must match mimeType from step 1
   └─ S3 enforces max size via presigned URL conditions

3. POST /api/v1/documents/:id/confirm
   ├─ StorageService.objectExists(objectKey) → verify upload succeeded
   ├─ API marks Document.status = ACTIVE
   └─ Audit log: "document_uploaded"

Abandoned uploads (PENDING > 24h) are cleaned up by a scheduled job.
```

---

## Download Flow

```
GET /api/v1/documents/:id/download
  ├─ Permission check (VIEW on folder + document visibility)
  ├─ StorageService.createDownloadUrl({ objectKey, filename })
  └─ Returns { downloadUrl, expiresAt }  (302 redirect or JSON, client's choice)
```

---

## Business Rules

1. Upload URL TTL is 15 minutes. After expiry the client must re-initiate.
2. Files up to 500 MB are supported in v1 (enforced via S3 presigned conditions).
3. Allowed MIME types are validated by the API before generating the upload URL:
   - Documents: pdf, docx, xlsx, pptx, odt, ods, odp
   - Images: jpeg, png, webp, gif
   - Text: plain, csv
4. The S3 bucket must have public access disabled; all access via presigned URLs only.
5. The `StorageService` is provided via NestJS DI — swap the binding in
   `StorageModule` to change backends (e.g. `NasStorageService`).
6. Object deletion is called on document delete AND on folder cascade delete.
   Failures are logged but do not block the DB delete (orphan cleanup can be done
   via a separate reconciliation job).

---

## Local Development

MinIO is used locally via Docker Compose:
```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  ports:
    - "9000:9000"
    - "9001:9001"
```

Set `S3_ENDPOINT=http://localhost:9000` in `.env.local`.
