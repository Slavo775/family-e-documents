# Documents Spec

## Overview
Documents are the core entity. Each document has rich metadata (name, title,
description, tags), lives in a folder, has an associated file in S3, and carries
a visibility setting that controls who can read it beyond folder-level permissions.

---

## Data Model

```prisma
model Document {
  id             String             @id @default(cuid())
  name           String             // short identifier (e.g. "tax-2024")
  title          String             // display title
  description    String?
  tags           String[]           // e.g. ["tax", "2024", "income"]
  folderId       String
  fileKey        String             // S3 object key
  mimeType       String
  sizeBytes      Int
  status         DocumentStatus     @default(PENDING)
  visibility     VisibilityMode     @default(PUBLIC)
  allowedUserIds String[]           // populated only when visibility=RESTRICTED
  uploadedById   String
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  // Full-text search vector (updated via Prisma raw / DB trigger)
  searchVector   Unsupported("tsvector")?

  folder         Folder             @relation(fields: [folderId], references: [id])
  uploadedBy     User               @relation(fields: [uploadedById], references: [id])

  @@index([folderId])
  @@index([uploadedById])
}

enum DocumentStatus {
  PENDING    // upload URL issued, file not yet confirmed
  ACTIVE     // file confirmed in S3, visible to users
  DELETED    // soft-deleted, S3 cleanup pending
}

enum VisibilityMode {
  PUBLIC      // access governed by folder permissions only
  RESTRICTED  // access governed by folder permissions AND allowedUserIds allowlist
}
```

---

## API Contract

### POST /api/v1/documents
```
// Initiates upload; returns presigned URL
Request:
  {
    name: string           // required, unique within folder
    title: string          // required
    description?: string
    tags?: string[]
    folderId: string       // required
    mimeType: string       // required
    sizeBytes: number      // required (must match actual file)
  }

Response 201:
  {
    documentId: string
    uploadUrl: string
    uploadExpiresAt: string
  }

Errors:
  400 — validation failure
  403 — user lacks UPLOAD on the folder
  409 — document name already exists in folder
```

### POST /api/v1/documents/:id/confirm
```
// Called after browser finishes PUT to S3
Response 200: DocumentPublic
Errors:
  404 — document not found
  400 — { message: "File not found in storage" }   // S3 check failed
  409 — { message: "Already confirmed" }
```

### GET /api/v1/documents
```
Query params:
  folderId?: string       // filter by folder
  status?: 'ACTIVE'       // default ACTIVE only
  page?: number           // default 1
  limit?: number          // default 20, max 100

Response 200:
  {
    data: DocumentPublic[]
    total: number
    page: number
    limit: number
  }

// Only returns documents the user can view (permission + visibility resolved)
```

### GET /api/v1/documents/:id
```
Response 200: DocumentPublic
Response 403: { message: "Forbidden" }
Response 404: { message: "Document not found" }
```

### GET /api/v1/documents/:id/download
```
Response 200: { downloadUrl: string, expiresAt: string }
Errors:
  403 — user cannot VIEW this document
  404 — document not found or not ACTIVE
```

### PATCH /api/v1/documents/:id
```
// Owner or ADMIN; cannot change folderId here (use move endpoint)
Request:
  {
    name?: string
    title?: string
    description?: string
    tags?: string[]
    visibility?: VisibilityMode
    allowedUserIds?: string[]    // only settable if user.canRestrictDocs=true or ADMIN
  }

Response 200: DocumentPublic
Errors:
  400 — attempting to set visibility=RESTRICTED without canRestrictDocs permission
  403 — not owner and not ADMIN
```

### POST /api/v1/documents/:id/move
```
// Move document to another folder
Request: { targetFolderId: string }
Response 200: DocumentPublic
Errors:
  403 — user lacks UPLOAD on targetFolderId
  403 — user lacks DELETE on source folderId (required to move out)
```

### DELETE /api/v1/documents/:id
```
// Soft-deletes (status=DELETED); S3 cleanup async
// Requires DELETE on folder or ADMIN
Response 204
Errors:
  403 — lacks DELETE permission
  404 — not found
```

---

## DocumentPublic shape

```ts
type DocumentPublic = {
  id: string
  name: string
  title: string
  description: string | null
  tags: string[]
  folderId: string
  folderName: string
  mimeType: string
  sizeBytes: number
  status: 'ACTIVE' | 'PENDING'
  visibility: 'PUBLIC' | 'RESTRICTED'
  allowedUserIds: string[]          // empty array if PUBLIC
  uploadedBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}
```

---

## Business Rules

1. `name` must be unique within a folder (case-insensitive).
2. `tags` are free-form lowercase strings, trimmed, max 32 chars each, max 20 tags.
3. A document in PENDING status is not visible to any user except the uploader and ADMIN.
4. Soft-deleted documents (status=DELETED) are excluded from all list/search results.
5. Only the document owner may set `visibility=RESTRICTED`, and only if
   `user.canRestrictDocs = true`. ADMIN may always set this field.
6. `allowedUserIds` is silently ignored when `visibility=PUBLIC`.
7. Moving a document does NOT change its visibility or allowedUserIds.
8. Duplicate file uploads (same name+folder) are rejected at the metadata POST
   step — client must rename or use a different folder.

---

## Permission implications
- UPLOAD on folder → can create documents in that folder.
- VIEW on folder + document visibility check → can list/read/download documents.
- DELETE on folder → can delete documents in that folder.
- Owner or ADMIN → can PATCH metadata.
- Move requires DELETE on source folder + UPLOAD on target folder.
