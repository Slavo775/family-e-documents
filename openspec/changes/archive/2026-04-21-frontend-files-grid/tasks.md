## 1. API Hooks

- [x] 1.1 Create `app/web/src/lib/api/documents.ts` with TanStack Query hook `useDocuments(folderId?: string)` calling `GET /api/v1/documents` (with optional `?folderId=` param). Return type matches `DocumentPublic[]` from `@family-docs/types`
- [x] 1.2 Create a date utility function (e.g., in `app/web/src/lib/utils/format-date.ts`) to convert ISO date strings to relative time ("2 days ago") using `date-fns` or similar

## 2. Files Grid Page

- [x] 2.1 Create `app/web/src/app/(app)/files/page.tsx` matching `design-template-app/.../src/routes/files.tsx`:
  - Wrapped in AppShell with breadcrumbs `["Family Documents", <folder name>]`
  - Header: folder name as h1, document count subtitle, grid/list view toggle (grid active, list links to `/files/list`), Upload button
  - Responsive card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
  - Each card: `FileTypeIcon` top-left, status badge top-right (ACTIVE=green, PENDING=yellow), name (line-clamp-2), up to 3 `TagChip`s + overflow count, date + uploader `UserAvatar` bottom row
  - Card hover: `-translate-y-0.5` + `shadow-md` + `border-brand/40`
  - Card click: sets `selectedDoc` state (stub for DocDetailPanel)
  - Upload button click: sets `uploadOpen` state (stub for UploadDialog)

## 3. Folder Integration

- [x] 3.1 Read active folder from URL search param (`?folder=`), pass to `useDocuments(folderId)`. Sync sidebar's `onSelectFolder` with URL param via `useRouter().replace()`

## 4. Verification

- [x] 4.1 Run typecheck and confirm zero errors
