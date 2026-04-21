## 1. API Hooks

- [x] 1.1 Create `app/web/src/lib/api/folders.ts` with TanStack Query hook `useFolderTree()` calling `GET /api/v1/folders/tree`, returns hierarchical folder data
- [x] 1.2 Create `app/web/src/lib/api/permissions.ts` with hooks:
  - `useFolderPermissions(folderId: string)`: `GET /api/v1/permissions/folder/:folderId` → permission rows with user, view/upload/delete/manage booleans, inherited flag, inheritedFrom
  - `useUpdatePermission()`: mutation, `PUT /api/v1/permissions/folder/:folderId/user/:userId` with permission flags, invalidates permissions query

## 2. Permissions Page

- [x] 2.1 Create `app/web/src/app/(app)/admin/permissions/page.tsx` matching `design-template-app/.../src/routes/admin.permissions.tsx`:
  - Wrapped in AppShell with breadcrumbs `["Admin", "Permissions"]`
  - **Two-panel grid** (`lg:grid-cols-[300px_1fr]`):
    - **Left panel** (Card, shadow-none, sticky): Desktop: "Select Folder" label + FolderTree (from `components/family/folder-tree.tsx`). Mobile: "Select Folder" label + Select dropdown with flattened folder names
    - **Right panel**: Header with "Permissions: <folder name>" h1, breadcrumb path (parent > child), "Add User" button
  - **Permissions table** (Card wrapping Table, min-w-[720px]):
    - Columns: User (avatar + name + email), View (Checkbox), Upload (Checkbox), Delete (Checkbox), Manage (Checkbox), Status (Badge), Remove button
    - Status Badge: "Explicit" (brand-soft bg) or "Inherited from /path" (muted bg)
    - Remove button per row (disabled for first/owner row)
    - Checkbox toggle calls `useUpdatePermission()` mutation
  - **Inline add-user row** (bg-brand-soft/40): shown when "Add User" clicked, auto-focus search Input, four Checkboxes, Cancel + Save buttons
  - **Empty state** row: "No explicit permissions. Users inherit from parent folder."

## 3. Verification

- [x] 3.1 Run typecheck and confirm zero errors
