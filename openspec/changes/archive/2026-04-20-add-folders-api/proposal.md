## Why

Documents need a home. Without a folder hierarchy, users have no way to organise
or navigate their files, and the permission system (which cascades from parent
folders) has nothing to attach to. Implementing the folders API is the prerequisite
for all document organisation and access control work.

## What Changes

- New NestJS `FoldersModule` with full CRUD endpoints under `/api/v1/folders`
- Prisma `Folder` model added to schema (self-referential tree, `parentId`)
- Permission-filtered folder listing (only folders a user can VIEW are returned)
- Folder move logic with permission recalculation on `PATCH parentId`
- Cascade delete strategy (ADMIN-only) that removes descendant folders, documents,
  and queues S3 object cleanup
- Root `/` folder seeded at bootstrap; cannot be deleted
- Shared `FolderNode` DTO published to `packages/types`

## Capabilities

### New Capabilities
- `folders`: Hierarchical folder tree with CRUD operations, permission-filtered
  listing, move support, and cascade delete

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **Backend**: new `FoldersModule` in `app/api`; Prisma schema migration
- **Shared types**: `FolderNode`, `FolderAction` enum added to `packages/types`
- **Permissions**: folder creation triggers permission cascade from parent (ties
  into the existing `FolderPermission` model defined in `permissions/spec.md`)
- **Storage**: cascade delete enqueues async S3 cleanup (no new infra; reuses
  existing storage abstraction)
- **Database**: new `Folder` table + unique constraint on `(parentId, name)`

## Non-goals

- Frontend folder browser UI (separate change)
- Permissions module implementation (separate change — `folders` only wires the
  cascade trigger, not the full permission resolution logic)
- Document move-between-folders (part of the documents change)
- Folder sharing / external links
