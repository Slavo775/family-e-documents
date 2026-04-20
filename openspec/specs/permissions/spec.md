# Permissions Spec

## Overview
Access control is resolved through three ordered layers. Every action on a
document or folder is checked against all three before being allowed or denied.

---

## Permission Actions

```ts
enum FolderAction {
  VIEW    = 'VIEW',     // list folder + read documents inside
  UPLOAD  = 'UPLOAD',   // create documents in folder
  DELETE  = 'DELETE',   // delete documents in folder (own + others)
  MANAGE  = 'MANAGE',   // rename/delete the folder itself, assign folder perms
}
```

---

## Data Model

```prisma
model FolderPermission {
  id         String         @id @default(cuid())
  folderId   String
  userId     String
  actions    FolderAction[]
  inherited  Boolean        @default(true)   // true = cascaded from parent
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  folder     Folder         @relation(fields: [folderId], references: [id], onDelete: Cascade)
  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([folderId, userId])
}

enum FolderAction {
  VIEW
  UPLOAD
  DELETE
  MANAGE
}
```

---

## Resolution Algorithm

For a given `(userId, folderId, action)` triple:

```
1. Fetch user record (role, canRestrictDocs)

2. LAYER 1 — Role baseline
   if user.role == ADMIN → ALLOW (skip layers 2 & 3)

   USER baseline:
     VIEW   → allowed by default
     UPLOAD → allowed by default
     DELETE → denied by default (own documents only unless overridden)
     MANAGE → denied by default

3. LAYER 2 — Folder permission (explicit or inherited)
   Resolve effective FolderPermission for this user + folder:
     a. Look for explicit FolderPermission row where inherited = false
     b. If none, walk up the folder tree collecting the nearest ancestor
        that has a FolderPermission row for this user
     c. If none found in tree, fall back to USER baseline from Layer 1
   Apply: if action ∈ resolvedPermission.actions → ALLOW, else DENY

4. LAYER 3 — Document visibility (only for VIEW action on a document)
   if document.visibility == PUBLIC → no further check
   if document.visibility == RESTRICTED:
     if userId ∈ document.allowedUserIds → ALLOW
     else → DENY
```

---

## Cascade + Override Semantics

- When a folder is created under a parent, the API copies the parent's
  `FolderPermission` rows for all users, setting `inherited = true`.
- An admin can override a specific user's permissions on a child folder by
  writing a new `FolderPermission` row with `inherited = false`.
- Overrides do NOT propagate upward; they only affect the folder they are set on
  and cascade down to that folder's children (marked inherited = true).
- Revoking all actions from a user on a folder (empty actions[]) effectively
  blocks that user even if the parent grants access.

```
Example cascade:
  /root                  → user Alice: [VIEW, UPLOAD]
    /Finance             → inherits Alice: [VIEW, UPLOAD]  (inherited=true)
      /Tax Returns       → override Alice: [VIEW]          (inherited=false)
        /2024            → inherits Alice: [VIEW]           (inherited=true)
```

---

## API Contract

All endpoints require ADMIN role.

### GET /api/v1/folders/:folderId/permissions
```
Response 200: FolderPermissionEntry[]

type FolderPermissionEntry = {
  userId: string
  userName: string
  actions: FolderAction[]
  inherited: boolean
  inheritedFrom?: string   // folder id if inherited
}
```

### PUT /api/v1/folders/:folderId/permissions/:userId
```
Request: { actions: FolderAction[] }

Response 200: FolderPermissionEntry
```

### DELETE /api/v1/folders/:folderId/permissions/:userId
```
// Removes explicit override; folder falls back to parent cascade
Response 204
```

---

## Business Rules

1. ADMIN bypasses all permission checks (Layer 1 short-circuit).
2. Deleting a folder cascades deletes all its `FolderPermission` rows.
3. Moving a document to a different folder re-evaluates access using the
   destination folder's permissions.
4. Document `allowedUserIds` can only be set by the document owner and only if
   `user.canRestrictDocs = true`. ADMIN can always edit this list.
5. An empty `allowedUserIds` on a RESTRICTED document means nobody except ADMIN
   can view it (effectively private to admin).
6. Folder MANAGE action allows renaming/deleting the folder but does NOT grant
   the ability to assign permissions to other users — that is ADMIN-only.

---

## Requirements

### Requirement: ADMIN can list all per-user permissions on a folder
The system SHALL expose `GET /api/v1/folders/:folderId/permissions` returning all
`FolderPermission` rows for the given folder as `FolderPermissionEntry[]`. The
`inheritedFrom` field SHALL be populated for rows where `inherited = true` by
walking up the folder tree to find the ancestor whose explicit permission row was
the origin of the cascade. This endpoint is restricted to ADMIN role.

#### Scenario: ADMIN lists permissions on a folder with explicit entries
- **WHEN** an ADMIN sends `GET /api/v1/folders/:folderId/permissions`
- **THEN** the response is HTTP 200 with `FolderPermissionEntry[]` containing all users who have a `FolderPermission` row on that folder
- **THEN** each entry includes `userId`, `userName`, `actions`, `inherited`, and `inheritedFrom` (when `inherited=true`)

#### Scenario: ADMIN lists permissions on a folder with inherited entries
- **WHEN** an ADMIN sends `GET /api/v1/folders/:folderId/permissions` for a folder whose permissions were cascaded from a parent
- **THEN** each `FolderPermissionEntry` with `inherited=true` includes `inheritedFrom` set to the ancestor folder ID that was the origin of the cascade

#### Scenario: ADMIN lists permissions on a folder with no permission rows
- **WHEN** an ADMIN sends `GET /api/v1/folders/:folderId/permissions` for a folder with no `FolderPermission` rows
- **THEN** the response is HTTP 200 with an empty array

#### Scenario: Non-ADMIN cannot list permissions
- **WHEN** a USER (non-ADMIN) sends `GET /api/v1/folders/:folderId/permissions`
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Folder not found
- **WHEN** an ADMIN sends `GET /api/v1/folders/:folderId/permissions` with an unknown `folderId`
- **THEN** the response is HTTP 404 Not Found

---

### Requirement: ADMIN can upsert an explicit permission override on a folder
The system SHALL expose `PUT /api/v1/folders/:folderId/permissions/:userId`. The
operation SHALL upsert a `FolderPermission` row with `inherited = false` (explicit
override), regardless of whether a row already exists. The response SHALL return
the full `FolderPermissionEntry` for the affected user. This endpoint is restricted
to ADMIN role.

#### Scenario: ADMIN sets permissions on a folder for a user with no existing row
- **WHEN** an ADMIN sends `PUT /api/v1/folders/:folderId/permissions/:userId` with `{ actions: ["VIEW", "UPLOAD"] }`
- **AND** no `FolderPermission` row exists for that `folderId + userId` pair
- **THEN** the response is HTTP 200 with `FolderPermissionEntry` where `actions = ["VIEW", "UPLOAD"]` and `inherited = false`
- **THEN** a `FolderPermission` row exists in the DB with `inherited = false`

#### Scenario: ADMIN overrides an existing inherited permission row
- **WHEN** an ADMIN sends `PUT /api/v1/folders/:folderId/permissions/:userId` with `{ actions: ["VIEW"] }`
- **AND** a `FolderPermission` row already exists with `inherited = true`
- **THEN** the response is HTTP 200 with the updated `FolderPermissionEntry` where `inherited = false`
- **THEN** the existing row is updated in-place with `inherited = false` and the new `actions`

#### Scenario: ADMIN sets empty actions to block a user on a folder
- **WHEN** an ADMIN sends `PUT /api/v1/folders/:folderId/permissions/:userId` with `{ actions: [] }`
- **THEN** the response is HTTP 200 with `FolderPermissionEntry` where `actions = []` and `inherited = false`
- **THEN** the user is effectively denied all access on that folder (even if parent grants access)

#### Scenario: Non-ADMIN cannot set permissions
- **WHEN** a USER (non-ADMIN) sends `PUT /api/v1/folders/:folderId/permissions/:userId`
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: PUT with invalid actions rejected
- **WHEN** an ADMIN sends `PUT /api/v1/folders/:folderId/permissions/:userId` with `{ actions: ["INVALID"] }`
- **THEN** the response is HTTP 400 Bad Request

---

### Requirement: ADMIN can remove an explicit permission override from a folder
The system SHALL expose `DELETE /api/v1/folders/:folderId/permissions/:userId`.
The operation SHALL remove the `FolderPermission` row for the given
`folderId + userId` pair. If no row exists the endpoint SHALL return HTTP 404.
This endpoint is restricted to ADMIN role.

#### Scenario: ADMIN deletes an explicit permission row
- **WHEN** an ADMIN sends `DELETE /api/v1/folders/:folderId/permissions/:userId`
- **AND** a `FolderPermission` row exists for that pair
- **THEN** the response is HTTP 204 No Content
- **THEN** the `FolderPermission` row no longer exists in the DB

#### Scenario: ADMIN deletes an inherited permission row
- **WHEN** an ADMIN sends `DELETE /api/v1/folders/:folderId/permissions/:userId`
- **AND** the matching row has `inherited = true`
- **THEN** the response is HTTP 204 No Content
- **THEN** the row is deleted regardless of its `inherited` flag

#### Scenario: DELETE on non-existent permission row returns 404
- **WHEN** an ADMIN sends `DELETE /api/v1/folders/:folderId/permissions/:userId`
- **AND** no `FolderPermission` row exists for that `folderId + userId` pair
- **THEN** the response is HTTP 404 Not Found

#### Scenario: Non-ADMIN cannot delete permissions
- **WHEN** a USER (non-ADMIN) sends `DELETE /api/v1/folders/:folderId/permissions/:userId`
- **THEN** the response is HTTP 403 Forbidden
