## Why

There's no document browsing UI in the frontend yet. The design template's primary document view is a responsive card grid (`/files`) showing documents with file type icons, status badges, tags, dates, and uploader info. This is the first page users see after login and the main entry point for document interaction.

## What Changes

- Create `/files` page at `app/(app)/files/page.tsx` with responsive card grid (1→2→3→4 columns)
- Document cards: file type icon, status badge (ACTIVE/PENDING), name, tags (max 3 + overflow), date, uploader avatar
- Grid/list view toggle (links to `/files/list`)
- Upload button (opens UploadDialog — stub trigger, dialog built in separate change)
- Card click opens DocDetailPanel (stub trigger, panel built in separate change)
- Page header with folder name, document count
- Wire to backend API: `GET /api/v1/documents` via TanStack Query
- Folder-scoped document fetching (filter by selected sidebar folder)

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/files.tsx` | Full files grid page: AppShell wrapper, header (folder name + count + view toggle + upload button), 4-column card grid with doc cards, UploadDialog trigger, DocDetailPanel trigger |
| `design-template-app/.../src/components/family/file-icon.tsx` | FileTypeIcon used in each card |
| `design-template-app/.../src/components/family/tag.tsx` | TagChip used for document tags |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar for uploader display |
| `design-template-app/.../src/lib/mock-data.ts` | MockDoc shape: id, name, kind, size, tags[], uploaderId, dateAgo, dateFull, status, folder |

## Capabilities

### New Capabilities
- `frontend-files-grid`: Document card grid view with file browsing, status badges, and folder-scoped filtering

### Modified Capabilities
<!-- None -->

## Non-goals

- Upload dialog implementation (separate `frontend-upload-dialog` change)
- Document detail panel implementation (separate `frontend-doc-detail` change)
- List/table view (separate `frontend-files-list` change)
- Drag-and-drop file upload
- Multi-select / batch operations
- Infinite scroll (simple pagination or load-all for v1)

## Impact

- `app/web/src/app/(app)/files/page.tsx`: new page
- `app/web/src/lib/api/documents.ts`: TanStack Query hooks for document fetching
- Dependencies: `frontend-app-shell` (AppShell, FileTypeIcon, TagChip, UserAvatar, FolderTree)
- Backend: uses existing `GET /api/v1/documents` endpoint
