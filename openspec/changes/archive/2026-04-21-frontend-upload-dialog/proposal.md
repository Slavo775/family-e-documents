## Why

Users need to upload documents. The design template shows a 3-step dialog: form (file dropzone, title, name, description, tags, folder select) → uploading (progress bar with cancel) → success (auto-close with "View Document" / "Upload Another" options). This is a shared component used from both the files grid and files list pages.

## What Changes

- Create `UploadDialog` component with 3-step flow
- Step 1 (form): drag-and-drop file zone, title input, name input, description textarea, tag input with Enter-to-add, folder select dropdown
- Step 2 (uploading): animated icon, file info, progress bar, cancel button
- Step 3 (success): checkmark, "Upload Complete!", view/upload-another links, auto-close after 2s
- Wire to backend: `POST /api/v1/documents` (get presigned URL) → `PUT` to S3 → `POST /api/v1/documents/:id/confirm`
- Integrate into files grid and files list pages

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/components/family/upload-dialog.tsx` | Full 3-step dialog: form with dropzone/title/name/description/tags/folder, uploading with progress, success with auto-close |
| `design-template-app/.../src/components/family/tag.tsx` | TagChip used in tag input area |
| `design-template-app/.../src/routes/files.tsx` | Shows UploadDialog integration: `<UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folder="Finance" />` |

## Capabilities

### New Capabilities
- `frontend-upload-dialog`: 3-step document upload flow with presigned URL upload to S3

### Modified Capabilities
<!-- None -->

## Non-goals

- Drag-and-drop from OS file manager (use click-to-browse only for v1)
- Multi-file upload
- File type validation on client (server validates MIME types)
- Resume interrupted uploads
- Image preview before upload

## Impact

- `app/web/src/components/family/upload-dialog.tsx`: new component
- `app/web/src/lib/api/documents.ts`: add upload mutation hooks
- `app/web/src/app/(app)/files/page.tsx`: import and render UploadDialog
- Dependencies: `frontend-app-shell` (TagChip), `frontend-files-grid` (page integration)
- shadcn: Dialog, Progress (may need to install)
- Backend: uses existing `POST /api/v1/documents`, `PUT` presigned URL, `POST /api/v1/documents/:id/confirm`
