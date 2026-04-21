## Why

Admins need a UI to assign per-folder, per-user permissions. The design template shows a two-panel layout at `/admin/permissions`: a left folder picker (tree on desktop, select dropdown on mobile) and a right permissions table with checkboxes for View/Upload/Delete/Manage per user, with Inherited/Explicit badges and an inline add-user row.

The backend Permissions API is implemented (`GET /api/v1/permissions/folder/:folderId`, `PUT /api/v1/permissions/folder/:folderId/user/:userId`) from the `add-permissions-api` change.

## What Changes

- Create `/admin/permissions` page at `app/(app)/admin/permissions/page.tsx`
- Left panel: FolderTree (desktop) or Select dropdown (mobile) for folder selection
- Right panel: header with folder name + breadcrumb path + "Add User" button
- Permissions table: user column (avatar + name + email), View/Upload/Delete/Manage checkboxes, Status badge (Explicit/Inherited with source), remove button
- Inline add-user row: search input + checkboxes + cancel/save buttons
- Wire to backend: `GET /api/v1/permissions/folder/:folderId` and `PUT` to update
- Checkbox toggle immediately calls API to update permission

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/admin.permissions.tsx` | Full permissions page: two-panel layout, FolderTree picker (desktop) + Select (mobile), permissions Table with checkboxes, Inherited/Explicit badges, add-user inline row |
| `design-template-app/.../src/components/family/folder-tree.tsx` | FolderTree reused in left panel |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar in table rows |
| `design-template-app/.../src/lib/mock-data.ts` | PermRow shape: user, view, upload, delete, manage, status (Explicit/Inherited), inheritedFrom |

## Capabilities

### New Capabilities
- `frontend-admin-permissions`: Admin folder permissions page with per-user permission checkboxes and inheritance display

### Modified Capabilities
<!-- None -->

## Non-goals

- Bulk permission changes
- Permission templates / presets
- Permission audit history
- Document-level permission overrides (only folder-level in this page)
- Drag-and-drop users between permission levels

## Impact

- `app/web/src/app/(app)/admin/permissions/page.tsx`: new page
- `app/web/src/lib/api/permissions.ts`: TanStack Query hooks for permission CRUD
- `app/web/src/lib/api/folders.ts`: hook for fetching folder tree
- Dependencies: `frontend-app-shell` (AppShell, FolderTree, UserAvatar)
- shadcn: Table, Checkbox, Badge, Select, Card (should be available)
- Backend: uses existing `GET/PUT /api/v1/permissions/folder/:folderId` endpoints
