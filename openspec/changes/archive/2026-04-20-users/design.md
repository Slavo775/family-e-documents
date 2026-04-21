## Context

The `User` Prisma model already exists with all required fields (`id`, `email`, `passwordHash`, `name`, `role`, `canRestrictDocs`, `createdAt`, `updatedAt`). The `RolesGuard` and `@Roles()` decorator exist in `app/api/src/common/`. The `BearerTokenGuard` is in `app/api/src/auth/`. All endpoints need both guards applied.

`packages/types/src/dtos.ts` has a partial `UserPublic` (missing `createdAt`) and no user mutation DTOs. These need to be added before the API module.

## Goals / Non-Goals

**Goals:**
- Complete `UsersController` with all five ADMIN-only routes
- `UsersService` implementing business rules (last-admin guard, ownership transfer on delete)
- Class-validator DTOs for create and update validation
- No direct `process.env` usage — all config via existing NestJS DI

**Non-Goals:**
- Self-service profile edit
- Password reset flows
- Email uniqueness enforced at DB level (already via Prisma `@unique`)

## Decisions

### Decision: DTOs defined in-module, not in `packages/types`

`CreateUserDto` and `UpdateUserDto` as **class-validator** decorated classes live in `app/api/src/users/dto/`. `packages/types` only holds plain TypeScript interfaces for cross-package sharing. The API module's DTO classes use `class-validator` decorators which are a server-only concern.

`packages/types` gets plain interfaces `CreateUserDto` and `UpdateUserDto` for any future frontend use, but they're separate from the NestJS DTO classes.

### Decision: Ownership transfer via single Prisma transaction

On user delete, a `prisma.$transaction` atomically:
1. Reassigns `Document.uploadedById` from deleted user to deleting admin
2. Removes deleted user's ID from all `Document.allowedUserIds` arrays
3. Deletes the user (cascades sessions and folder permissions via Prisma schema)

This prevents partial state if any step fails.

### Decision: Last-admin check in service, not DB constraint

The "cannot delete/downgrade last admin" rule is enforced by counting `ADMIN` role users in the service before the operation. This is simpler than a DB trigger and acceptable since user management is low-traffic.

### Decision: Password hashing in `UsersService`, not controller

`bcryptjs` rounds = 10, matching the auth module convention.

## Risks / Trade-offs

- **Race condition on last-admin check** → Two concurrent requests could both pass the "last admin" check and both delete/downgrade. Mitigation: acceptable in a family app (extremely low concurrency); a DB-level constraint could be added later.
- **`allowedUserIds` removal is document-by-document** → If a user is on many document allowlists, this is N queries inside the transaction. Mitigation: acceptable for v1 scale.

## Migration Plan

1. Update `packages/types/src/dtos.ts`
2. Create `app/api/src/users/dto/` with DTO classes
3. Implement `UsersService`
4. Implement `UsersController`
5. Create `UsersModule` and wire into `AppModule`
6. Typecheck
