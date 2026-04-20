## ADDED Requirements

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
