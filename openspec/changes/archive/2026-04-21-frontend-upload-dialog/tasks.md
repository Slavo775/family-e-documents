## 1. shadcn Components

- [x] 1.1 Install `Progress` and `Dialog` (if not present) and `Textarea` into `packages/ui`, export from index

## 2. API Hooks

- [x] 2.1 Add upload mutation hooks to `app/web/src/lib/api/documents.ts`:
  - `useCreateDocument()`: `POST /api/v1/documents` with metadata, returns `{ id, uploadUrl }`
  - `useConfirmDocument()`: `POST /api/v1/documents/:id/confirm`
- [x] 2.2 Create `app/web/src/lib/upload-to-s3.ts`: helper that `PUT`s a File to a presigned URL using XMLHttpRequest, returns a Promise and accepts an `onProgress(percent: number)` callback

## 3. Upload Dialog Component

- [x] 3.1 Create `app/web/src/components/family/upload-dialog.tsx` matching `design-template-app/.../src/components/family/upload-dialog.tsx`:
  - Props: `open`, `onOpenChange`, `folder` (default folder name)
  - **Step "form"**: Dialog with DialogHeader "Upload Document", file dropzone (dashed border, UploadCloud icon, click to select file via hidden input), Title input (required), Name input (required + helper text), Description textarea, Tags input (inline chips with Enter-to-add, TagChip with remove), Folder select dropdown, Cancel/Upload buttons
  - **Step "uploading"**: centered layout with pulsing UploadCloud icon, file name + size, Progress bar, percentage text, Cancel button (resets to form)
  - **Step "success"**: CheckCircle2 icon in green circle, "Upload Complete!" heading, file name, "View Document" link + "Upload Another" button, auto-close after 2s
  - State reset on dialog close (200ms delay)

## 4. Integration

- [x] 4.1 Import `UploadDialog` in `app/web/src/app/(app)/files/page.tsx`, render with `open={uploadOpen}` and `onOpenChange={setUploadOpen}`, wire Upload button's `onClick` to `setUploadOpen(true)`

## 5. Verification

- [x] 5.1 Run typecheck and confirm zero errors
