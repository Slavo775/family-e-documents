## Context

The backend Permissions API at `app/api/src/permissions/` provides:
- `GET /api/v1/permissions/folder/:folderId` → array of permission entries per user (with inherited flag and source)
- `PUT /api/v1/permissions/folder/:folderId/user/:userId` → set permissions for a user on a folder

The Folders API provides `GET /api/v1/folders/tree` → hierarchical folder tree.

The FolderTree component is built in `frontend-app-shell`. The design template at `design-template-app/.../src/routes/admin.permissions.tsx` shows the exact layout.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template's two-panel layout
- Real permission data from API
- Checkbox toggles call API to update immediately
- Inherited vs Explicit badge display with inheritance source
- Inline add-user row with search and permission checkboxes
- Responsive: tree on desktop, select on mobile

**Non-Goals:**
- Permission history/audit
- Bulk changes
- Custom permission levels beyond View/Upload/Delete/Manage

## Decisions

### Decision: Two-panel grid layout

Use CSS grid `lg:grid-cols-[300px_1fr]`. On mobile, the folder picker collapses to a Select dropdown. On desktop, the left panel is sticky (`lg:sticky lg:top-20`) to keep it visible while scrolling the permissions table.

### Decision: FolderTree from app-shell, real data from API

Fetch folder tree from `GET /api/v1/folders/tree` and pass to the FolderTree component. The same data populates the mobile Select dropdown (flattened with indented names).

### Decision: Optimistic checkbox updates

When toggling a permission checkbox, update the UI immediately and fire `PUT /api/v1/permissions/folder/:folderId/user/:userId` in background. On error, revert the checkbox and show error toast.

### Decision: Add-user inline row

Clicking "Add User" shows an extra table row with a search input, four unchecked checkboxes, and Cancel/Save buttons. The search input filters available users (those not already in the table). On Save, calls the API to create the permission entry.

### Decision: Inherited permissions are read-only visually

Rows with "Inherited" status show checkboxes in a muted state. Toggling them converts the row to "Explicit" (overrides inheritance). This matches the design template behavior where `toggle` sets `status: "Explicit"`.

## Risks / Trade-offs

- **Inherited permission resolution is server-side** — The frontend displays what the API returns for each folder. Changing a parent folder's permissions cascades server-side. The UI just refetches.
- **User search in add-row** — Needs a list of all users. Can reuse `useUsers()` from `frontend-admin-users` API hooks.

## Migration Plan

1. Create folders API hook (folder tree)
2. Create permissions API hooks
3. Create permissions page with two-panel layout
4. Add permissions table with checkboxes
5. Add inline add-user row
6. Typecheck
