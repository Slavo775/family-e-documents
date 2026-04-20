## 1. Shared Types

- [x] 1.1 Add `FolderAction` enum (`VIEW | UPLOAD | DELETE | MANAGE`) to `packages/types/src/enums.ts`
- [x] 1.2 Add `FolderNode` DTO interface to `packages/types/src/dtos.ts`
- [x] 1.3 Add Zod schemas for `CreateFolderDto` and `UpdateFolderDto` to `packages/types/src/schemas.ts`
- [x] 1.4 Export new types from `packages/types/src/index.ts`

## 2. Database Migration

- [x] 2.1 Add `Folder` model to `prisma/schema.prisma` (self-referential, `@@unique([parentId, name])`)
- [x] 2.2 Verify `FolderPermission` model references `Folder` correctly
- [x] 2.3 Run migration `20260420120000_add_folders_unique` — applied via `prisma migrate deploy`
- [x] 2.4 Update `prisma/seed.ts` to upsert the root `/` folder (`parentId = null`, `name = "/"`) idempotently

## 3. FoldersModule Scaffold

- [x] 3.1 Create `app/api/src/folders/folders.module.ts`
- [x] 3.2 Create `app/api/src/folders/folders.service.ts`
- [x] 3.3 Create `app/api/src/folders/folders.controller.ts`
- [x] 3.4 Register `FoldersModule` in `AppModule`
- [x] 3.5 Inject `PrismaService` and `PermissionsService` into `FoldersService`

## 4. Permission-Filtered Listing (GET /api/v1/folders)

- [x] 4.1 Implement `FoldersService.list({ userId, role, parentId?, flat? })` — checks VIEW via PermissionsService; ADMIN bypasses
- [x] 4.2 Map Prisma results to `FolderNode` (include `childCount`, `documentCount`, `userPermissions`)
- [x] 4.3 Wire `GET /api/v1/folders` controller action with JWT guard and query param validation

## 5. Single Folder Retrieval (GET /api/v1/folders/:id)

- [x] 5.1 Implement `FoldersService.findOne(id, userId, role)` — returns `FolderNode & { breadcrumbs }` or throws 403/404
- [x] 5.2 Build breadcrumb chain by walking `parentId` up to root
- [x] 5.3 Wire `GET /api/v1/folders/:id` controller action

## 6. Create Folder (POST /api/v1/folders)

- [x] 6.1 Implement `FoldersService.create(dto, userId, role)` — enforce root-only-ADMIN rule, MANAGE check on parent
- [x] 6.2 Copy inherited `FolderPermission` rows from parent to new folder within a transaction
- [x] 6.3 Handle 409 on unique constraint violation (`parentId + name`)
- [x] 6.4 Wire `POST /api/v1/folders` controller action with body validation

## 7. Update Folder (PATCH /api/v1/folders/:id)

- [x] 7.1 Implement `FoldersService.update(id, dto, userId, role)` — MANAGE check on the folder
- [x] 7.2 Implement cycle detection using recursive CTE (`WITH RECURSIVE`) before accepting a `parentId` change
- [x] 7.3 On move: delete inherited permission rows, re-cascade from new parent (same transaction)
- [x] 7.4 Handle 400 (cycle), 409 (duplicate name), 403 (no MANAGE)
- [x] 7.5 Wire `PATCH /api/v1/folders/:id` controller action

## 8. Delete Folder (DELETE /api/v1/folders/:id)

- [x] 8.1 Implement `FoldersService.remove(id, strategy, userId, role)` — MANAGE required; cascade requires ADMIN
- [x] 8.2 `strategy=reject`: return 400 if folder has children or documents
- [x] 8.3 `strategy=cascade`: collect all descendant IDs via recursive CTE, delete folders + documents in transaction, collect S3 keys
- [x] 8.4 Stub async S3 cleanup: log collected keys (replace with real worker later)
- [x] 8.5 Guard against deleting the root folder (400)
- [x] 8.6 Wire `DELETE /api/v1/folders/:id` controller action with query param validation

## 9. Swagger / OpenAPI

- [x] 9.1 Annotate controller with `@ApiTags('folders')` and all `@ApiOperation`, `@ApiResponse` decorators
- [x] 9.2 Annotate DTOs with `@ApiProperty` decorators (via class-validator decorators visible to Swagger)

## 10. Tests

- [x] 10.1 Unit test `FoldersService.list` — permission filtering logic
- [x] 10.2 Unit test cycle detection helper
- [x] 10.3 Unit test permission cascade helper (create + move)
- [x] 10.4 E2E test `POST /api/v1/folders` — happy path + 403 + 409
- [x] 10.5 E2E test `PATCH /api/v1/folders/:id` — move + cycle error
- [x] 10.6 E2E test `DELETE /api/v1/folders/:id` — reject non-empty + cascade
