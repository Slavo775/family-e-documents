## ADDED Requirements

### Requirement: List folders filtered by user permissions
The API SHALL return only folders for which the calling user has at least VIEW
permission. ADMIN users see all folders unconditionally.

#### Scenario: User lists root-level folders they can view
- **WHEN** an authenticated USER calls `GET /api/v1/folders` with no `parentId`
- **THEN** the response is 200 with a `FolderNode[]` containing only root-level
  folders where the user holds at least VIEW permission

#### Scenario: ADMIN lists all root-level folders
- **WHEN** an authenticated ADMIN calls `GET /api/v1/folders` with no `parentId`
- **THEN** the response is 200 with all root-level folders regardless of permission rows

#### Scenario: User lists children of a folder they cannot view
- **WHEN** a USER calls `GET /api/v1/folders?parentId=<id>` for a folder they
  have no VIEW permission on
- **THEN** the response is 200 with an empty array (folder existence is not leaked)

#### Scenario: Flat list for breadcrumb use
- **WHEN** a USER calls `GET /api/v1/folders?flat=true`
- **THEN** the response is 200 with a flat `FolderNode[]` of all viewable folders
  (not structured as a tree)

---

### Requirement: Get single folder with breadcrumbs
The API SHALL return a single folder by ID including its ancestor breadcrumb
chain, or a 403/404 as appropriate.

#### Scenario: User retrieves a folder they can view
- **WHEN** a USER calls `GET /api/v1/folders/:id` for a folder they have VIEW on
- **THEN** the response is 200 with `FolderNode & { breadcrumbs: { id, name }[] }`
  where breadcrumbs are ordered from root to parent

#### Scenario: User retrieves a folder they cannot view
- **WHEN** a USER calls `GET /api/v1/folders/:id` for a folder they have no VIEW on
- **THEN** the response is 403 with `{ message: "Forbidden" }`

#### Scenario: Folder does not exist
- **WHEN** any authenticated user calls `GET /api/v1/folders/:id` with an unknown ID
- **THEN** the response is 404 with `{ message: "Folder not found" }`

---

### Requirement: Create a folder
The API SHALL allow ADMIN users or users with MANAGE on the parent folder to
create a new subfolder. On creation, parent folder permissions are cascaded
to the new folder as inherited rows.

#### Scenario: ADMIN creates a root-level folder
- **WHEN** an ADMIN calls `POST /api/v1/folders` with `{ name: "Family Docs" }`
  (no `parentId`)
- **THEN** the response is 201 with the new `FolderNode`
- **AND** inherited permissions are not applicable (no parent)

#### Scenario: USER with MANAGE on parent creates a subfolder
- **WHEN** a USER with MANAGE permission on folder X calls `POST /api/v1/folders`
  with `{ name: "Sub", parentId: "<X>" }`
- **THEN** the response is 201 with the new `FolderNode`
- **AND** all `FolderPermission` rows from folder X with `inherited=true` are
  copied to the new folder with `inherited=true`

#### Scenario: USER without MANAGE on parent attempts to create a subfolder
- **WHEN** a USER without MANAGE on the parent calls `POST /api/v1/folders`
- **THEN** the response is 403 with `{ message: "Forbidden" }`

#### Scenario: USER attempts to create a root-level folder
- **WHEN** a non-ADMIN USER calls `POST /api/v1/folders` with no `parentId`
- **THEN** the response is 403 with `{ message: "Forbidden" }`

#### Scenario: Duplicate sibling name
- **WHEN** a folder with the same `name` already exists under the same `parentId`
- **THEN** the response is 409 with `{ message: "A folder with that name already exists here" }`

---

### Requirement: Rename or move a folder
The API SHALL allow users with MANAGE on the folder to rename it or move it to
a new parent. A move recalculates all inherited permissions.

#### Scenario: USER with MANAGE renames a folder
- **WHEN** a USER with MANAGE calls `PATCH /api/v1/folders/:id` with `{ name: "New Name" }`
- **THEN** the response is 200 with the updated `FolderNode`

#### Scenario: USER with MANAGE moves a folder to a new parent
- **WHEN** a USER with MANAGE calls `PATCH /api/v1/folders/:id` with `{ parentId: "<newParentId>" }`
- **THEN** the response is 200 with the updated `FolderNode`
- **AND** inherited `FolderPermission` rows on the folder are deleted and
  re-cascaded from the new parent
- **AND** explicit (`inherited=false`) permission rows are preserved

#### Scenario: Folder moved into its own descendant
- **WHEN** a user attempts to move folder A into a descendant of A
- **THEN** the response is 400 with `{ message: "Cannot move folder into its own descendant" }`

#### Scenario: Name conflict at destination
- **WHEN** the rename or move would create a duplicate sibling name
- **THEN** the response is 409 with `{ message: "A folder with that name already exists here" }`

#### Scenario: USER without MANAGE attempts to rename
- **WHEN** a USER without MANAGE calls `PATCH /api/v1/folders/:id`
- **THEN** the response is 403 with `{ message: "Forbidden" }`

---

### Requirement: Delete a folder
The API SHALL allow deletion of empty folders (requires MANAGE) or cascade
deletion of folders with contents (requires ADMIN). The root folder cannot be
deleted.

#### Scenario: Delete an empty folder with default strategy
- **WHEN** a USER with MANAGE calls `DELETE /api/v1/folders/:id` with no strategy param
- **AND** the folder has no documents and no children
- **THEN** the response is 204

#### Scenario: Delete a non-empty folder with strategy=reject
- **WHEN** a user calls `DELETE /api/v1/folders/:id?strategy=reject`
- **AND** the folder has documents or children
- **THEN** the response is 400 with `{ message: "Folder is not empty" }`

#### Scenario: ADMIN cascade-deletes a folder with contents
- **WHEN** an ADMIN calls `DELETE /api/v1/folders/:id?strategy=cascade`
- **THEN** the response is 204
- **AND** all descendant folders and their documents are deleted from the database
- **AND** their S3 object keys are queued for async cleanup

#### Scenario: Non-ADMIN attempts cascade delete
- **WHEN** a non-ADMIN user calls `DELETE /api/v1/folders/:id?strategy=cascade`
- **THEN** the response is 403 with `{ message: "Forbidden" }`

#### Scenario: Attempt to delete the root folder
- **WHEN** any user calls `DELETE /api/v1/folders/<root-id>`
- **THEN** the response is 400 with `{ message: "Cannot delete the root folder" }`

---

### Requirement: Root folder seeded at bootstrap
The system SHALL seed a single root folder at application bootstrap. This root
folder has `parentId = null` and `name = "/"` and cannot be deleted via the API.

#### Scenario: Root folder exists after fresh deployment
- **WHEN** `prisma db seed` is run on a fresh database
- **THEN** exactly one folder with `parentId IS NULL` and `name = "/"` exists

#### Scenario: Seed is idempotent
- **WHEN** `prisma db seed` is run more than once
- **THEN** only one root folder exists (upsert, not insert)
