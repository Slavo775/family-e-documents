## Context

The backend document upload flow is:
1. `POST /api/v1/documents` with metadata → returns `{ id, uploadUrl }` (presigned S3 URL)
2. Client `PUT`s file to `uploadUrl` directly
3. `POST /api/v1/documents/:id/confirm` → marks document as ACTIVE

The design template at `design-template-app/.../src/components/family/upload-dialog.tsx` shows the exact 3-step UI. shadcn Dialog is available; Progress may need to be installed.

The folder list for the folder select dropdown can be fetched from `GET /api/v1/folders/tree` or hardcoded initially.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template's 3-step dialog
- Real upload flow: metadata → presigned URL → S3 PUT → confirm
- Tag input with Enter-to-add and remove
- Progress tracking during S3 upload (using XMLHttpRequest or fetch with ReadableStream)
- Auto-close on success after 2 seconds
- Form validation with Zod (title required, name required, file required)

**Non-Goals:**
- Drag-and-drop (click to browse only)
- Multi-file upload
- Client-side file type/size validation

## Decisions

### Decision: XMLHttpRequest for upload progress

`fetch()` doesn't support upload progress in all browsers. Use `XMLHttpRequest` with `upload.onprogress` to report real upload percentage to the progress bar. Wrap in a Promise for clean async/await.

### Decision: Folder select from API

Fetch folder tree from `GET /api/v1/folders/tree` and flatten to a `<select>` dropdown with indented names (e.g., "Finance / Tax Returns"). Falls back to static list if API unavailable.

### Decision: Form state reset on close

When the dialog closes, reset to "form" step after a 200ms delay (matches design template behavior) to avoid showing the success step briefly when reopening.

### Decision: React Hook Form for the form step

Use `react-hook-form` + Zod for the form step validation. Fields: file (required), title (required, string), name (required, string), description (optional), tags (string array), folderId (required).

## Risks / Trade-offs

- **S3 CORS** — The presigned URL PUT requires S3 CORS to allow the frontend origin. This is an infrastructure concern, not a code issue, but must be configured.
- **Large file handling** — Files up to 500MB (server limit). The progress bar handles this naturally but the dialog shouldn't freeze.

## Migration Plan

1. Install shadcn Progress component if not present
2. Create upload API mutation hooks
3. Create UploadDialog component with 3-step flow
4. Integrate into files grid page
5. Typecheck
