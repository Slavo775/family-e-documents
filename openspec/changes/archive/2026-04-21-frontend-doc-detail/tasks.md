## 1. shadcn Components

- [x] 1.1 Install `Switch` and `AlertDialog` into `packages/ui` if not already present, export from index

## 2. API Hooks

- [x] 2.1 Add to `app/web/src/lib/api/documents.ts`:
  - `useDocumentDownloadUrl(id)`: `GET /api/v1/documents/:id/download-url`
  - `useDeleteDocument()`: mutation calling `DELETE /api/v1/documents/:id`, invalidates documents query
  - `useUpdateDocumentMetadata()`: mutation calling `PATCH /api/v1/documents/:id/metadata` for tags/description/visibility updates

## 3. Doc Detail Panel Component

- [x] 3.1 Create `app/web/src/components/family/doc-detail-panel.tsx` matching `design-template-app/.../src/components/family/doc-detail.tsx`:
  - Props: `doc: DocumentPublic | null`, `onClose: () => void`
  - Sheet `side="right"`, `max-w-[480px]`, full height, overflow-y-auto
  - **Sticky header** (border-b, bg-card, p-6): FileTypeIcon (lg) + document name (SheetTitle) + status badge (ACTIVE/PENDING), quick action buttons row (Download, Edit placeholder, Move placeholder, Delete with destructive styling)
  - **Metadata section**: h4 "Metadata" label, 2-column `dl` grid: Name, Folder, Size, Type, Uploaded by (UserAvatar + name), Created date
  - **Tags section** (Separator above): h4 "Tags" label, TagChips with remove callback, "+ Add tag" button (inline input on click, Enter to add)
  - **Visibility section** (Separator above): h4 "Visibility" label, card with "Restricted Access" toggle (Switch), description text changes based on state, when restricted show "Allowed users" sub-card with user chips + "+ Add" button
  - **Description section** (Separator above): h4 "Description" label, italic text or "No description"
- [x] 3.2 Wire Download button to fetch presigned URL and trigger browser download
- [x] 3.3 Wire Delete button to open AlertDialog confirmation, on confirm call delete mutation and close panel

## 4. Integration

- [x] 4.1 Import `DocDetailPanel` in `app/web/src/app/(app)/files/page.tsx`, render with `doc={selectedDoc}` and `onClose={() => setSelectedDoc(null)}`

## 5. Verification

- [x] 5.1 Run typecheck and confirm zero errors
