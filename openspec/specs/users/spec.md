# Users Spec

## Overview
User management is ADMIN-only. Admins create accounts, assign roles, and control
per-user capability flags (e.g. whether a user may restrict document visibility).

---

## Data Model

See `auth/spec.md` for the `User` and `Session` models.

Additional DTO shapes:

```ts
// Returned from API (never includes passwordHash)
type UserPublic = {
  id: string
  email: string
  name: string
  role: Role
  canRestrictDocs: boolean
  createdAt: string
}

// Admin creates a user
type CreateUserDto = {
  email: string
  password: string       // plain — API hashes it
  name: string
  role?: Role            // defaults to USER
  canRestrictDocs?: boolean  // defaults to false
}

// Admin updates a user
type UpdateUserDto = Partial<{
  email: string
  name: string
  role: Role
  canRestrictDocs: boolean
  password: string       // triggers re-hash
}>
```

---

## API Contract

All endpoints require `Authorization: Bearer <token>` and ADMIN role.

### GET /api/v1/users
```
Response 200: UserPublic[]
```

### GET /api/v1/users/:id
```
Response 200: UserPublic
Response 404: { message: "User not found" }
```

### POST /api/v1/users
```
Request: CreateUserDto

Response 201: UserPublic
Response 409: { message: "Email already in use" }
Response 400: validation errors
```

### PATCH /api/v1/users/:id
```
Request: UpdateUserDto

Response 200: UserPublic
Response 404: { message: "User not found" }
Response 400: validation errors
```

### DELETE /api/v1/users/:id
```
Response 204
Response 400: { message: "Cannot delete the last ADMIN" }
Response 404: { message: "User not found" }
```

---

## Business Rules

1. Only ADMIN can call any endpoint in this module.
2. An admin cannot delete their own account or the last remaining ADMIN.
3. An admin cannot downgrade the last remaining ADMIN to USER.
4. `canRestrictDocs` defaults to `false` on user creation.
5. When a user is deleted:
   - Their sessions are cascade-deleted.
   - Their `FolderPermission` rows are cascade-deleted.
   - Their uploaded documents are NOT deleted — ownership transfers to the deleting admin.
   - Document `allowedUserIds` entries referencing the deleted user are removed.
6. Password must be ≥ 8 characters (validated on create and update).
7. Email must be a valid RFC 5321 address (class-validator `@IsEmail()`).

---

## Permission implications
- Only ADMIN role can access this module.
- The `canRestrictDocs` flag on a User is read by the permissions resolver
  (Layer 3) to decide if that user may set document visibility to RESTRICTED.
