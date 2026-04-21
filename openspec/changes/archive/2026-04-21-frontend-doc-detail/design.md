## Context

The backend provides:
- `GET /api/v1/documents/:id` — full document details
- `GET /api/v1/documents/:id/download-url` — presigned download URL
- `DELETE /api/v1/documents/:id` — delete document
- `PATCH /api/v1/documents/:id/metadata` — update tags, description, visibility

The design template at `design-template-app/.../src/components/family/doc-detail.tsx` shows the exact layout. The Sheet component and Switch component from shadcn are needed.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template's doc detail panel
- Real Download action (fetch presigned URL, trigger browser download)
- Real Delete action with confirmation dialog
- Tag management (add/remove) via API
- Visibility toggle with allowed-users display

**Non-Goals:**
- Edit metadata form (placeholder button)
- Move to folder (placeholder button)
- Document preview

## Decisions

### Decision: Sheet component for slide-over

Use shadcn's `Sheet` with `side="right"` and `max-w-[480px]`, matching the design template exactly. The Sheet is controlled via `open` prop and `onOpenChange`.

### Decision: Optimistic tag updates

When adding/removing tags, update the UI immediately (optimistic) and call `PATCH /api/v1/documents/:id/metadata` in the background. On error, revert via TanStack Query's `onError` rollback.

### Decision: Download via hidden anchor

Fetch the presigned download URL from the API, create a temporary `<a>` element with `download` attribute, and click it programmatically. This avoids opening a new tab.

### Decision: Delete with AlertDialog confirmation

Clicking the Delete button opens a shadcn AlertDialog (similar to the user delete confirmation in admin). On confirm, call `DELETE /api/v1/documents/:id` and invalidate the documents query cache.

## Risks / Trade-offs

- **Visibility toggle requires `canRestrictDocs`** — The current user may not have permission to toggle visibility. The toggle should be disabled/hidden based on user permissions. Check `user.canRestrictDocs` from auth context.

## Migration Plan

1. Install shadcn Switch and AlertDialog if not present
2. Create API hooks (download URL, delete, metadata update)
3. Create DocDetailPanel component
4. Integrate into files grid page
5. Typecheck
