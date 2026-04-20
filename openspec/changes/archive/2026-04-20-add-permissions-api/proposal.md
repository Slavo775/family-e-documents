## Why

The permission resolution logic already exists (`PermissionsService`), and the
folder+document modules consume it — but there is no API surface for an ADMIN to
actually assign, view, or revoke those permissions. Without this, access control
is only adjustable by directly seeding the database, making it unusable in
production.

## What Changes

- New `PermissionsController` under `app/api` exposing three ADMIN-only endpoints:
  - `GET /api/v1/folders/:folderId/permissions` — list all per-user permissions on a folder
  - `PUT /api/v1/folders/:folderId/permissions/:userId` — upsert a user's explicit (`inherited=false`) permission on a folder
  - `DELETE /api/v1/folders/:folderId/permissions/:userId` — remove an explicit override, reverting to parent cascade
- New `FolderPermissionEntry` DTO added to `packages/types`
- `PermissionsModule` gains a controller and exposes the service to handle the new endpoints

## Capabilities

### New Capabilities
- `permissions`: ADMIN-facing API to list, assign, and revoke per-user folder permissions

### Modified Capabilities
_(none — permission resolution logic is unchanged; this only adds the management surface)_

## Impact

- **Backend**: `PermissionsController` added to `app/api/src/permissions/`; `PermissionsModule` gains a controller
- **Shared types**: `FolderPermissionEntry` interface added to `packages/types`
- **Auth**: All three endpoints gated to ADMIN role via `RolesGuard`
- **Folders**: `inheritedFrom` field on `FolderPermissionEntry` requires a tree-walk query; no schema changes needed

## Non-goals

- Permission assignment by non-ADMIN users (spec §BR6: MANAGE does not grant permission assignment)
- Bulk permission operations (set permissions for multiple users at once)
- Permission history / audit trail (the existing audit log middleware covers this)
- Frontend permission management UI (separate change)
