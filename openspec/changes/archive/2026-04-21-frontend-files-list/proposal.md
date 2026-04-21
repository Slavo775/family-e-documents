## Why

The design template offers a second document view — a table/list layout at `/files/list` (called "Explorer") with filtering by tags, sorting, desktop table with action dropdowns, mobile card list, pagination, and an empty state CTA. This complements the grid view and provides a power-user document browsing experience.

## What Changes

- Create `/files/list` page at `app/(app)/files/list/page.tsx`
- Desktop filter bar: active tag chips with remove, "+ Add tag" dropdown, sort dropdown, grid/list view toggle
- Mobile filter bar: "Filters" button opening bottom Sheet, Upload button
- Desktop data table: file icon, name, tags, size, uploader, date, actions dropdown (Download/Edit/Move/Delete)
- Mobile card list: file icon, name, size + date, more button
- Pagination controls (Previous/Next + page numbers)
- Empty state: Inbox icon, "No documents here yet" message, "Upload your first document" CTA
- Reuse UploadDialog and DocDetailPanel from previous changes
- Wire to same `GET /api/v1/documents` API with tag/sort filters

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/files.list.tsx` | Full list page: desktop filter bar (tags + sort + view toggle), mobile filter Sheet, desktop Table with actions dropdown, mobile card list, pagination, empty state |
| `design-template-app/.../src/components/family/doc-detail.tsx` | DocDetailPanel opened on row/card click |
| `design-template-app/.../src/components/family/tag.tsx` | TagChip used in filter bar and table cells |
| `design-template-app/.../src/components/family/file-icon.tsx` | FileTypeIcon used in table and cards |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar for uploader column |

## Capabilities

### New Capabilities
- `frontend-files-list`: Document table/list view with tag filtering, sorting, pagination, and mobile-responsive cards

### Modified Capabilities
<!-- None -->

## Non-goals

- Server-side pagination (client-side for v1 — small document count)
- Advanced filter combinations (AND/OR)
- Column resizing or reordering
- Bulk select / batch operations
- Saved filter presets

## Impact

- `app/web/src/app/(app)/files/list/page.tsx`: new page
- `app/web/src/lib/api/documents.ts`: extend hook to support tag/sort params
- Dependencies: `frontend-app-shell` (AppShell, TagChip, FileTypeIcon, UserAvatar), `frontend-upload-dialog` (UploadDialog), `frontend-doc-detail` (DocDetailPanel)
- shadcn: Table, DropdownMenu, Sheet (should be available from previous changes)
