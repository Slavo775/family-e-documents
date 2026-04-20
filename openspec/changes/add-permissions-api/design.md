## Context

The `PermissionsModule` already contains `PermissionsService` with the full
permission resolution algorithm (`canPerformAction`, `canViewDocument`). It is
marked `@Global()` and consumed by `FoldersService` and `DocumentsService`.
The `FolderPermission` Prisma model is fully defined and migrated.

What is missing is the ADMIN-facing management surface: there is no way to read
or write `FolderPermission` rows via the API. This change adds a
`PermissionsController` inside `PermissionsModule` to fill that gap.

The spec (`openspec/specs/permissions/spec.md`) defines three endpoints. This
design covers the key decisions for implementing them.

## Goals / Non-Goals

**Goals:**
- Add `PermissionsController` with GET, PUT, DELETE endpoints for
  `/api/v1/folders/:folderId/permissions`
- Gate all three endpoints to ADMIN role via `RolesGuard`
- Populate `inheritedFrom` on the list response by walking up the folder tree
  for inherited rows
- Add `FolderPermissionEntry` DTO to `packages/types`

**Non-Goals:**
- Changing the permission resolution algorithm (already correct in `PermissionsService`)
- Non-ADMIN permission assignment
- Bulk/batch permission endpoints
- Frontend UI

## Decisions

### 1. Controller lives inside PermissionsModule, not FoldersModule

**Decision**: `PermissionsController` is added to `app/api/src/permissions/`,
registered in `PermissionsModule`.

**Alternatives considered**:
- Nest it under `FoldersModule` (e.g., a sub-resource controller) — would create
  a circular dependency since `PermissionsModule` is global and already consumed
  by `FoldersModule`.

**Rationale**: Keeping permissions management in its own module avoids circular
dependency and keeps the separation clean. The route
`/api/v1/folders/:folderId/permissions` is just a URL convention, not a
requirement to live inside `FoldersModule`.

---

### 2. PUT upserts with `inherited=false`

**Decision**: `PUT /api/v1/folders/:folderId/permissions/:userId` always writes
`inherited = false` (explicit override), regardless of whether a row already
exists.

**Rationale**: This matches the spec intent — ADMIN is explicitly setting a
permission on a folder. An inherited row from a parent cascade is implicitly
managed by the folder create/move logic; the management API only deals with
explicit overrides.

---

### 3. DELETE removes explicit row only; inherited rows remain

**Decision**: `DELETE /api/v1/folders/:folderId/permissions/:userId` deletes
only the row where `folderId + userId` match. If the row is inherited, the
endpoint still deletes it (returning 204) — re-cascade from parent is not
automatically triggered.

**Alternatives considered**:
- Reject DELETE on inherited rows — confusing UX since ADMINs managing
  permissions need to be able to clean up rows regardless of origin.

**Rationale**: Keep the operation simple. An ADMIN who wants to restore cascade
from the parent can use PUT to set the parent's permissions again, or the
folders create/move logic will handle re-cascade on the next structural change.

---

### 4. `inheritedFrom` resolved by tree walk, not stored

**Decision**: The `inheritedFrom` field on `FolderPermissionEntry` is computed
at query time by walking up `parentId` to find the ancestor whose
`FolderPermission` row was the origin of the cascade.

**Rationale**: Storing `inheritedFrom` in the DB would require updating it on
every cascade operation (create, move). A read-time tree walk is O(depth) per
row, which is negligible at family scale.

---

### 5. RolesGuard + Roles decorator for ADMIN gating

**Decision**: Use the existing `RolesGuard` (already in `app/api/src/common/`)
with `@Roles(Role.ADMIN)` on the controller class.

**Rationale**: Consistent with how other ADMIN-only operations are handled.
`RolesGuard` depends on `BearerTokenGuard` having already populated `req.user`.

## Risks / Trade-offs

- **`inheritedFrom` tree walk cost** → O(rows × depth) on the list endpoint.
  At family scale (< 20 users, < 100 folders) this is imperceptible. If the
  app grows, a single `WITH RECURSIVE` CTE could replace the loop.
  Mitigation: noted as a known limitation; acceptable for v1.

- **DELETE on inherited row leaves tree inconsistency** → If an inherited row is
  deleted but the parent still has a permission, the child folder falls back to
  the USER baseline rather than the parent grant. This may be surprising.
  Mitigation: document this clearly in the API response; a future "reset to
  parent" endpoint can be added if needed.
