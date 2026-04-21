## Context

The NestJS backend has `GET /api/v1/documents` which returns documents with fields matching the `DocumentPublic` type in `packages/types`. The AppShell and helper components (FileTypeIcon, TagChip, UserAvatar) are provided by `frontend-app-shell`. The design template at `design-template-app/.../src/routes/files.tsx` shows the exact layout.

## Goals / Non-Goals

**Goals:**
- Responsive card grid matching design template (1/2/3/4 columns at breakpoints)
- Real data from API via TanStack Query
- Folder-scoped filtering synced with sidebar folder selection
- Stub integration points for UploadDialog and DocDetailPanel

**Non-Goals:**
- Upload dialog (separate change)
- Doc detail panel (separate change)
- Search within files view
- Sorting/filtering beyond folder scope

## Decisions

### Decision: TanStack Query for data fetching

Use `@tanstack/react-query` with a custom hook `useDocuments(folderId)` that calls `GET /api/v1/documents?folderId=xxx`. The query key includes the folderId so it refetches when the sidebar folder changes. The API client from `lib/api.ts` handles auth headers.

### Decision: Folder state synced via URL search params

The active folder is stored as a URL search param (`?folder=finance`) so it's shareable and survives page refresh. The sidebar's `onSelectFolder` updates the URL param. The page reads `searchParams.folder` and passes it to the API query.

### Decision: Stub callbacks for upload and doc detail

The Upload button sets state `uploadOpen=true` but renders nothing if UploadDialog isn't available yet. Similarly, card click sets `selectedDoc` but renders nothing if DocDetailPanel isn't imported. These are replaced in subsequent changes. Alternatively, use dynamic imports with fallback.

### Decision: Document card matches design template exactly

Each card: rounded-lg border, hover translate-y + shadow, file icon top-left, status badge top-right, name (line-clamp-2), tags (max 3 + "+N" overflow), date + uploader avatar bottom row.

## Risks / Trade-offs

- **API shape mismatch** — The backend's `DocumentPublic` may not have all fields the card needs (e.g., `dateAgo` is relative time). Mitigation: compute relative time client-side from `createdAt` ISO string using a utility like `date-fns/formatDistanceToNow`.
- **Empty state** — If no documents exist, the grid shows nothing. A proper empty state is handled in `frontend-files-list` but we should show a minimal "No documents" message here too.

## Migration Plan

1. Create TanStack Query hooks for documents
2. Create the files grid page component
3. Wire folder selection to URL params
4. Add stub triggers for upload/detail
5. Typecheck
