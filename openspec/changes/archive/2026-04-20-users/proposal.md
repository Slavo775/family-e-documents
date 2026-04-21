## Why

The API has no Users module — there's no way for admins to create accounts, manage roles, or control per-user capability flags. The `users/` directory doesn't exist yet in `app/api/src/`, and `packages/types` is missing the `CreateUserDto` and `UpdateUserDto` shapes (plus `UserPublic` is missing its `createdAt` field).

## What Changes

- Add `CreateUserDto`, `UpdateUserDto` to `packages/types/src/dtos.ts`; add `createdAt` to `UserPublic`
- Create `app/api/src/users/` with `UsersController`, `UsersService`, and `UsersModule`
- Implement five ADMIN-only endpoints: list, get, create, update, delete
- Enforce the "last ADMIN" safety rules (no self-delete, no last-admin delete, no last-admin downgrade)
- On user delete: reassign uploaded documents to the deleting admin, remove from document `allowedUserIds`
- Wire `UsersModule` into `AppModule`

## Capabilities

### New Capabilities
- `users`: ADMIN-only CRUD for user accounts with role management and capability flag control

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Non-goals

- Self-service profile updates (users editing their own accounts)
- Password reset / forgot-password flows
- User invitation emails
- Pagination on the user list (small user base in v1)

## Impact

- `packages/types/src/dtos.ts`: `UserPublic` gets `createdAt`; new `CreateUserDto`, `UpdateUserDto` exports
- `app/api/src/users/`: new module (controller, service, module)
- `app/api/src/app.module.ts`: import `UsersModule`
- Prisma: no schema changes — `User` model already has all required fields
