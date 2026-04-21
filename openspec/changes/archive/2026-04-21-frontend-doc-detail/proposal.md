## Why

When a user clicks a document card (in grid or list view), they need to see document details without navigating away. The design template shows a right-side Sheet slide-over panel displaying: file icon + status badge, quick action buttons (Download, Edit, Move, Delete), metadata grid (name, folder, size, type, uploader, created), tags with add capability, visibility toggle (restricted/public with allowed-users list), and description.

## What Changes

- Create `DocDetailPanel` Sheet component
- Sticky header: file type icon, document name, status badge, quick action buttons row
- Metadata section: 2-column grid with label/value pairs
- Tags section: tag chips with remove + "Add tag" button
- Visibility section: restricted access toggle switch, allowed users list (when restricted)
- Description section
- Wire Download action to presigned download URL from API
- Wire Delete action to `DELETE /api/v1/documents/:id` with confirmation
- Integrate into files grid page (and later files list page)

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/components/family/doc-detail.tsx` | Full DocDetailPanel Sheet: sticky header with icon+name+status+actions, metadata grid, tags with add, visibility toggle with allowed users, description |
| `design-template-app/.../src/components/family/file-icon.tsx` | FileTypeIcon used in header |
| `design-template-app/.../src/components/family/tag.tsx` | TagChip used in tags section |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar used in metadata (uploader) and allowed users list |
| `design-template-app/.../src/routes/files.tsx` | Shows DocDetailPanel integration: `<DocDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />` |

## Capabilities

### New Capabilities
- `frontend-doc-detail`: Document detail slide-over panel with metadata, actions, tags, and visibility management

### Modified Capabilities
<!-- None -->

## Non-goals

- Inline document preview / PDF viewer
- Document version history
- Comment/annotation system
- Edit metadata inline (Edit button is a placeholder for now)
- Move to different folder (Move button is a placeholder)

## Impact

- `app/web/src/components/family/doc-detail-panel.tsx`: new component
- `app/web/src/lib/api/documents.ts`: add download URL hook, delete mutation, tag update mutation
- `app/web/src/app/(app)/files/page.tsx`: import and render DocDetailPanel
- Dependencies: `frontend-app-shell` (FileTypeIcon, TagChip, UserAvatar), `frontend-files-grid` (page integration)
- shadcn: Sheet, Switch, Separator (should be available from app-shell change)
