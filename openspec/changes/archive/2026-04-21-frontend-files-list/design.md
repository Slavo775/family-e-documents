## Context

The files grid page (`frontend-files-grid`) already uses `useDocuments()` hook. This page reuses the same hook with additional filter parameters. The UploadDialog and DocDetailPanel are available from their respective changes. The design template at `design-template-app/.../src/routes/files.list.tsx` shows the exact layout.

shadcn components needed: Table, DropdownMenu, Sheet — all should be installed by previous changes.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template's list view
- Tag filtering (toggle tags on/off)
- Sort options: Date newest, Date oldest, Name A-Z, Size largest
- Desktop table + mobile cards (responsive, not just hidden overflow)
- Pagination UI (client-side page slicing for v1)
- Empty state with upload CTA

**Non-Goals:**
- Server-side pagination
- Column sorting by clicking headers
- Saved filters

## Decisions

### Decision: Client-side filtering and sorting

For v1, fetch all documents for the current folder, then filter by selected tags and sort client-side. This avoids API changes and works fine for a family-scale document count. The filter/sort state is stored in component state (not URL params — too noisy).

### Decision: Shared filter bar component

The desktop filter bar and mobile filter sheet share the same `FilterBarContent` component (as in the design template). This avoids duplicating the tag toggle and sort dropdown logic.

### Decision: Reuse UploadDialog and DocDetailPanel

Import and render both components. Upload button triggers UploadDialog. Row/card click triggers DocDetailPanel. These are the same instances used in the grid view.

### Decision: Actions dropdown per row

Each table row has a `MoreHorizontal` icon that opens a DropdownMenu with Download, Edit, Move, Delete actions. Download works (presigned URL). Delete opens confirmation. Edit and Move are placeholders.

## Risks / Trade-offs

- **Client-side pagination** may struggle with very large document sets. Mitigation: acceptable for a family app; can add server-side pagination later by extending the API hook.

## Migration Plan

1. Create list page with filter bar and table
2. Add mobile card layout and filter Sheet
3. Add pagination controls
4. Add empty state
5. Wire UploadDialog and DocDetailPanel
6. Typecheck
