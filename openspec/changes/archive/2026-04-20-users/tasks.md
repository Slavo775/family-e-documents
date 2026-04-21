## 1. Shared Types

- [x] 1.1 Add `createdAt: string` to `UserPublic` in `packages/types/src/dtos.ts`
- [x] 1.2 Add `CreateUserDto` interface to `packages/types/src/dtos.ts`
- [x] 1.3 Add `UpdateUserDto` interface to `packages/types/src/dtos.ts`
- [x] 1.4 Export new types from `packages/types/src/index.ts`

## 2. NestJS DTO Classes

- [x] 2.1 Create `app/api/src/users/dto/create-user.dto.ts` with class-validator decorators (`@IsEmail`, `@MinLength(8)`, `@IsEnum(Role)`, `@IsBoolean`)
- [x] 2.2 Create `app/api/src/users/dto/update-user.dto.ts` using `PartialType(CreateUserDto)`

## 3. UsersService

- [x] 3.1 Create `app/api/src/users/users.service.ts` with `PrismaService` and `BearerTokenGuard` injected
- [x] 3.2 Implement `findAll()`: return all users as `UserPublic[]`
- [x] 3.3 Implement `findOne(id)`: return user or throw `NotFoundException`
- [x] 3.4 Implement `create(dto)`: hash password with bcryptjs, throw `ConflictException` on duplicate email
- [x] 3.5 Implement `update(id, dto, requesterId)`: handle password re-hash; enforce last-admin downgrade guard
- [x] 3.6 Implement `remove(id, requesterId)`: enforce self-delete and last-admin guards; run Prisma transaction (reassign documents, remove from allowedUserIds, delete user)

## 4. UsersController

- [x] 4.1 Create `app/api/src/users/users.controller.ts` with `@UseGuards(BearerTokenGuard, RolesGuard)` and `@Roles(Role.ADMIN)` applied at controller level
- [x] 4.2 Implement `GET /` → `findAll()`
- [x] 4.3 Implement `GET /:id` → `findOne(id)`
- [x] 4.4 Implement `POST /` → `create(dto)` with `@HttpCode(201)`
- [x] 4.5 Implement `PATCH /:id` → `update(id, dto, req.user.id)`
- [x] 4.6 Implement `DELETE /:id` → `remove(id, req.user.id)` with `@HttpCode(204)`

## 5. UsersModule and Wiring

- [x] 5.1 Create `app/api/src/users/users.module.ts` importing `PrismaModule`
- [x] 5.2 Import `UsersModule` into `app/api/src/app.module.ts`

## 6. Verification

- [x] 6.1 Run `pnpm --filter "app/api" typecheck` and confirm zero errors
