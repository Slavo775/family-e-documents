# Folders Spec

## Overview
Documents are organised in a hierarchical folder tree. Folders can be nested
arbitrarily. Every document lives in exactly one folder. Permissions cascade
from parent folders (see permissions/spec.md).

---

## Data Model

```prisma
model Folder {
  id          String    @id @default(cuid())
  name        String
  parentId    String?
  createdById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  parent      Folder?   @relation("FolderTree", fields: [parentId], references: [id])
  children    Folder[]  @relation("FolderTree")
  createdBy   User      @relation(fields: [createdById], references: [id])
  documents   Document[]
  permissions FolderPermission[]

  @@unique([parentId, name])   // sibling names must be unique
}
```

---

## API Contract

### GET /api/v1/folders
```
// Returns folder tree the calling user can VIEW (permission-filtered)
Query params:
  parentId?: string   // list immediate children of this folder (null = root)
  flat?: boolean      // return flat list instead of tree (useful for breadcrumbs)

Response 200: FolderNode[]

type FolderNode = {
  id: string
  name: string
  parentId: string | null
  childCount: number
  documentCount: number
  userPermissions: FolderAction[]   // effective perms for calling user
  createdAt: string
}
```

### GET /api/v1/folders/:id
```
Response 200: FolderNode & { breadcrumbs: { id, name }[] }
Response 403: { message: "Forbidden" }
Response 404: { message: "Folder not found" }
```

### POST /api/v1/folders
```
// ADMIN only — or user with MANAGE on parent
Request:
  { name: string, parentId?: string }

Response 201: FolderNode

On create: cascade parent FolderPermission rows to new folder (inherited=true)
```

### PATCH /api/v1/folders/:id
```
// Requires MANAGE on this folder
Request:
  { name?: string, parentId?: string }   // parentId = move folder

Response 200: FolderNode
Response 400: { message: "Cannot move folder into its own descendant" }
Response 409: { message: "A folder with that name already exists here" }
```

### DELETE /api/v1/folders/:id
```
// Requires MANAGE on this folder; ADMIN only if folder contains documents
Request query:
  ?strategy=reject|cascade
    reject   (default) — 400 if folder has documents or children
    cascade  — recursively deletes all children and documents (ADMIN only)

Response 204
Response 400: { message: "Folder is not empty" }   // only when strategy=reject
```

---

## Business Rules

1. Root-level folders (`parentId = null`) can only be created by ADMIN.
2. Sibling folder names must be unique (enforced by DB unique constraint).
3. Moving a folder (`PATCH parentId`) recalculates all inherited permissions:
   - Explicit overrides (`inherited = false`) are preserved.
   - Inherited rows are deleted and re-cascaded from the new parent.
4. Deleting a folder with `strategy=cascade` deletes all descendant folders,
   all contained documents, and their S3 objects (async cleanup job).
5. The root `/` folder is seeded at bootstrap and cannot be deleted.
6. A user sees a folder in GET /api/v1/folders only if they have at least VIEW
   permission (resolved per permissions/spec.md).

---

## Permission implications
- Creating a subfolder requires MANAGE on the parent folder (or ADMIN role).
- Renaming or moving requires MANAGE on the folder itself.
- Deleting with cascade requires ADMIN role.
- GET endpoints return only folders the calling user can VIEW.
