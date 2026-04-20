## 1. Shared Types

- [x] 1.1 Add `FolderPermissionEntry` interface to `packages/types/src/dtos.ts`
- [x] 1.2 Add `UpsertFolderPermissionSchema` Zod schema and `UpsertFolderPermissionDto` type to `packages/types/src/schemas.ts`
- [x] 1.3 Export `FolderPermissionEntry` and `UpsertFolderPermissionDto` from `packages/types/src/index.ts`

## 2. PermissionsController

- [x] 2.1 Create `app/api/src/permissions/permissions.controller.ts` with `PermissionsController` class decorated `@Controller('api/v1/folders/:folderId/permissions')` and `@Roles(Role.ADMIN)` and `@UseGuards(BearerTokenGuard, RolesGuard)`
- [x] 2.2 Implement `GET /` handler calling `permissionsService.listForFolder(folderId)`
- [x] 2.3 Implement `PUT /:userId` handler calling `permissionsService.upsertForFolder(folderId, userId, dto)`
- [x] 2.4 Implement `DELETE /:userId` handler calling `permissionsService.removeForFolder(folderId, userId)` with `@HttpCode(204)`
- [x] 2.5 Add inline `UpsertPermissionBodyDto` class with `actions: FolderAction[]` validated via `@IsArray()` and `@IsEnum(FolderAction, { each: true })`
- [x] 2.6 Add Swagger decorators (`@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`) to controller and each handler

## 3. PermissionsService — Management Methods

- [x] 3.1 Add `listForFolder(folderId: string): Promise<FolderPermissionEntry[]>` to `PermissionsService` — queries all `FolderPermission` rows for the folder, resolves `inheritedFrom` by tree-walking `parentId` chain, throws `NotFoundException` if folder does not exist
- [x] 3.2 Add `upsertForFolder(folderId: string, userId: string, actions: FolderAction[]): Promise<FolderPermissionEntry>` — upserts a `FolderPermission` row with `inherited = false`, throws `NotFoundException` if folder or user not found
- [x] 3.3 Add `removeForFolder(folderId: string, userId: string): Promise<void>` — deletes the `FolderPermission` row, throws `NotFoundException` if no matching row exists
- [x] 3.4 Add private helper `resolveInheritedFrom(folderId: string, userId: string): Promise<string | undefined>` — walks up `parentId` to find the first ancestor with a `FolderPermission` row for the user

## 4. Register Controller in PermissionsModule

- [x] 4.1 Add `PermissionsController` to `controllers` array in `app/api/src/permissions/permissions.module.ts`
- [x] 4.2 Ensure `AuthModule` is imported in `PermissionsModule` (needed for `BearerTokenGuard`)

## 5. Tests

- [x] 5.1 Create `app/api/src/permissions/permissions.controller.spec.ts` with standalone test module; test ADMIN access for GET, PUT, DELETE and that 403 is returned for non-ADMIN (via `RolesGuard` mock)
- [x] 5.2 Add unit tests to `app/api/src/permissions/permissions.service.spec.ts` (or create new file) covering: `listForFolder` returns entries with correct `inheritedFrom`; `upsertForFolder` creates new row with `inherited=false`; `upsertForFolder` overwrites existing inherited row; `removeForFolder` deletes row; `removeForFolder` throws 404 when row missing
