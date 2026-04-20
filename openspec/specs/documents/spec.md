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

---

## Requirements

### Requirement: User can initiate a document upload
The system SHALL accept document metadata via `POST /api/v1/documents`, validate it, create a `Document` record with `status=PENDING`, generate a presigned S3 PUT URL, and return the `documentId` and upload URL to the caller. The caller MUST have `UPLOAD` permission on the target folder.

#### Scenario: Successful upload initiation
- **WHEN** an authenticated user with UPLOAD permission on a folder sends a valid `POST /api/v1/documents` request
- **THEN** the response is HTTP 201 with `{ documentId, uploadUrl, uploadExpiresAt }`
- **THEN** a `Document` row exists in the DB with `status=PENDING` and the provided metadata

#### Scenario: Upload initiation rejected — missing UPLOAD permission
- **WHEN** an authenticated user without UPLOAD permission on the target folder sends `POST /api/v1/documents`
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Upload initiation rejected — duplicate name in folder
- **WHEN** a user sends `POST /api/v1/documents` with a name that already exists (case-insensitive) in the same folder
- **THEN** the response is HTTP 409 Conflict

#### Scenario: Upload initiation rejected — validation failure
- **WHEN** a user sends `POST /api/v1/documents` with a missing required field (e.g., no `folderId`)
- **THEN** the response is HTTP 400 Bad Request

---

### Requirement: User can confirm a completed upload
The system SHALL accept `POST /api/v1/documents/:id/confirm`, verify the file exists in S3, mark the document `status=ACTIVE`, and return the full `DocumentPublic` shape.

#### Scenario: Successful confirmation
- **WHEN** the uploader sends `POST /api/v1/documents/:id/confirm` after successfully uploading to S3
- **THEN** the response is HTTP 200 with the `DocumentPublic` of the now-ACTIVE document

#### Scenario: Confirmation rejected — file not found in S3
- **WHEN** the uploader sends `POST /api/v1/documents/:id/confirm` before the file is present in S3
- **THEN** the response is HTTP 400 with `{ message: "File not found in storage" }`

#### Scenario: Confirmation rejected — already confirmed
- **WHEN** the uploader sends `POST /api/v1/documents/:id/confirm` on a document that is already ACTIVE
- **THEN** the response is HTTP 409 with `{ message: "Already confirmed" }`

---

### Requirement: User can list documents they are permitted to view
The system SHALL expose `GET /api/v1/documents` returning a paginated list of `DocumentPublic` entries. Results MUST be scoped to documents the requesting user can view (folder VIEW permission + document visibility check). Only `ACTIVE` documents are returned by default. `PENDING` and `DELETED` documents are excluded unless the user is ADMIN or the document owner.

#### Scenario: Authenticated user retrieves visible documents in a folder
- **WHEN** an authenticated user sends `GET /api/v1/documents?folderId=<id>`
- **THEN** the response is HTTP 200 with `{ data, total, page, limit }` containing only ACTIVE documents in that folder the user can view

#### Scenario: RESTRICTED documents excluded for non-allowlisted user
- **WHEN** a user who is not in `allowedUserIds` requests documents in a folder containing a RESTRICTED document
- **THEN** that RESTRICTED document is NOT present in the response

#### Scenario: Pagination defaults applied
- **WHEN** an authenticated user sends `GET /api/v1/documents` with no page or limit params
- **THEN** the response defaults to `page=1` and `limit=20`

---

### Requirement: User can retrieve a single document
The system SHALL expose `GET /api/v1/documents/:id`. The response is `DocumentPublic` if the user can view the document, or 403/404 otherwise.

#### Scenario: Authorized retrieval
- **WHEN** an authenticated user with VIEW permission on the folder sends `GET /api/v1/documents/:id`
- **THEN** the response is HTTP 200 with the `DocumentPublic`

#### Scenario: Access denied by visibility
- **WHEN** an authenticated user with folder VIEW permission sends `GET /api/v1/documents/:id` for a RESTRICTED document they are not in `allowedUserIds` for
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Document not found
- **WHEN** a user requests a document ID that does not exist or is DELETED
- **THEN** the response is HTTP 404 Not Found

---

### Requirement: User can generate a presigned download URL
The system SHALL expose `GET /api/v1/documents/:id/download`, check VIEW permission + visibility, then return a presigned S3 GET URL valid for the configured TTL (default 1 hour).

#### Scenario: Successful download URL generation
- **WHEN** an authenticated user with VIEW access sends `GET /api/v1/documents/:id/download`
- **THEN** the response is HTTP 200 with `{ downloadUrl: string, expiresAt: string }`

#### Scenario: Download forbidden — no VIEW permission
- **WHEN** an authenticated user without VIEW permission on the folder requests a download URL
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Download not available — document not ACTIVE
- **WHEN** a user requests a download URL for a PENDING or DELETED document
- **THEN** the response is HTTP 404 Not Found

---

### Requirement: Owner or ADMIN can update document metadata
The system SHALL expose `PATCH /api/v1/documents/:id`. Only the document owner or an ADMIN can update metadata. Setting `visibility=RESTRICTED` additionally requires `user.canRestrictDocs=true` (unless ADMIN). Changing `folderId` via PATCH is NOT allowed.

#### Scenario: Owner updates title and tags
- **WHEN** the document owner sends `PATCH /api/v1/documents/:id` with `{ title: "New Title", tags: ["tax"] }`
- **THEN** the response is HTTP 200 with the updated `DocumentPublic`

#### Scenario: Metadata update rejected — not owner and not ADMIN
- **WHEN** a user who is not the document owner and not ADMIN sends a PATCH request
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Visibility restriction rejected — no canRestrictDocs
- **WHEN** a document owner without `canRestrictDocs=true` sends `PATCH /api/v1/documents/:id` with `{ visibility: "RESTRICTED" }`
- **THEN** the response is HTTP 400 Bad Request

#### Scenario: ADMIN can always set RESTRICTED visibility
- **WHEN** an ADMIN sends `PATCH /api/v1/documents/:id` with `{ visibility: "RESTRICTED", allowedUserIds: ["uid1"] }`
- **THEN** the response is HTTP 200 with the updated document

---

### Requirement: User can move a document to another folder
The system SHALL expose `POST /api/v1/documents/:id/move`. The caller MUST have `DELETE` permission on the source folder and `UPLOAD` permission on the target folder. Moving does NOT change visibility or `allowedUserIds`.

#### Scenario: Successful move
- **WHEN** a user with DELETE on source and UPLOAD on target sends `POST /api/v1/documents/:id/move` with `{ targetFolderId }`
- **THEN** the response is HTTP 200 with `DocumentPublic` reflecting the new `folderId`
- **THEN** `visibility` and `allowedUserIds` are unchanged

#### Scenario: Move rejected — lacks DELETE on source
- **WHEN** a user without DELETE permission on the source folder attempts to move a document
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Move rejected — lacks UPLOAD on target
- **WHEN** a user with DELETE on source but without UPLOAD on the target folder attempts to move
- **THEN** the response is HTTP 403 Forbidden

---

### Requirement: User with DELETE permission can soft-delete a document
The system SHALL expose `DELETE /api/v1/documents/:id`. The caller MUST have `DELETE` permission on the folder, or be ADMIN. Deletion sets `status=DELETED` in the DB and attempts S3 object deletion (best-effort). The document is excluded from all subsequent list and retrieval results.

#### Scenario: Successful soft-delete
- **WHEN** a user with DELETE permission on the folder sends `DELETE /api/v1/documents/:id`
- **THEN** the response is HTTP 204 No Content
- **THEN** the document no longer appears in `GET /api/v1/documents` results

#### Scenario: Delete rejected — lacks DELETE permission
- **WHEN** a user without DELETE permission sends `DELETE /api/v1/documents/:id`
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Delete of non-existent document
- **WHEN** any user sends `DELETE /api/v1/documents/:id` for a document that does not exist
- **THEN** the response is HTTP 404 Not Found

---

### Requirement: Tags are normalized and validated on write
The system SHALL normalize document tags on create and update: trim whitespace, convert to lowercase, enforce max 32 characters per tag, enforce max 20 tags total. Requests exceeding these constraints SHALL be rejected with HTTP 400.

#### Scenario: Tags are lowercased and trimmed on save
- **WHEN** a user creates a document with tags `[" Tax ", "INCOME"]`
- **THEN** the stored tags are `["tax", "income"]`

#### Scenario: Too many tags rejected
- **WHEN** a user submits more than 20 tags
- **THEN** the response is HTTP 400 Bad Request

#### Scenario: Tag too long rejected
- **WHEN** a user submits a tag longer than 32 characters
- **THEN** the response is HTTP 400 Bad Request

---

### Requirement: Document name is unique within its folder (case-insensitive)
The system SHALL reject any create or rename that would result in two documents with the same name (case-insensitively) in the same folder, returning HTTP 409.

#### Scenario: Duplicate name on create rejected
- **WHEN** a document named `"tax-2024"` exists in a folder and a user tries to create another document named `"Tax-2024"` in the same folder
- **THEN** the response is HTTP 409 Conflict

#### Scenario: Duplicate name on rename rejected
- **WHEN** a user sends `PATCH /api/v1/documents/:id` with a `name` that already exists (case-insensitive) in the same folder
- **THEN** the response is HTTP 409 Conflict
