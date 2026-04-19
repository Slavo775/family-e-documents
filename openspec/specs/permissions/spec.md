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
