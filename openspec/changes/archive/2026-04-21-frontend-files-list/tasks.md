## 1. Filter Bar

- [x] 1.1 Create `FilterBarContent` component (can be in the same file or extracted) with tag toggle buttons and sort select dropdown, matching `design-template-app/.../src/routes/files.list.tsx` FilterBarContent

## 2. List Page

- [x] 2.1 Create `app/web/src/app/(app)/files/list/page.tsx` matching `design-template-app/.../src/routes/files.list.tsx`:
  - Wrapped in AppShell with breadcrumbs `["Family Documents", <folder name>]`
  - **Desktop filter bar** (hidden sm:flex, h-12, border-b): active TagChips with remove, "+ Add tag" DropdownMenu, sort DropdownMenu, grid/list view toggle (list active), empty-state toggle (dev only, remove in prod)
  - **Mobile filter bar** (sm:hidden): "Filters (N)" button opening bottom Sheet with FilterBarContent, Upload button
  - **Desktop Table** (hidden sm:block): Card wrapping Table with columns: icon, Name (truncate, font-semibold), Tags (max 2 + overflow), Size, Uploaded by (UserAvatar + name), Date (title=dateFull), Actions (MoreHorizontal → DropdownMenu with Download/Edit/Move/Delete)
  - Row click → opens DocDetailPanel
  - Actions dropdown: Download, Edit (placeholder), Move (placeholder), Delete (destructive, separator above)
  - **Mobile card list** (sm:hidden): file icon, name (truncate), size + date, MoreHorizontal icon
  - Card click → opens DocDetailPanel

## 3. Pagination

- [x] 3.1 Add pagination controls below the table/cards: "1–N of M documents" text, Previous/Next buttons + page number buttons. Client-side: slice documents array by page (e.g., 20 per page)

## 4. Empty State

- [x] 4.1 Add empty state when `documents.length === 0`: centered Inbox icon (h-20 w-20 rounded-full bg-muted), "No documents here yet" heading, subtitle text, "Upload your first document" CTA button

## 5. Integration

- [x] 5.1 Import and render `UploadDialog` (from `frontend-upload-dialog`) and `DocDetailPanel` (from `frontend-doc-detail`), wire to page state

## 6. Verification

- [x] 6.1 Run typecheck and confirm zero errors
