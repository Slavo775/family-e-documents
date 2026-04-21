## Context

The backend Users API at `app/api/src/users/` provides:
- `GET /api/v1/users` → `UserPublic[]` (all users, ordered by createdAt)
- `GET /api/v1/users/:id` → `UserPublic`
- `POST /api/v1/users` → create user (email, name, password, role?, canRestrictDocs?)
- `PATCH /api/v1/users/:id` → update user (all fields optional, including password)
- `DELETE /api/v1/users/:id` → delete user (guards: no self-delete, no last-admin)

All endpoints require ADMIN role. The `UserPublic` type includes: id, email, name, role, canRestrictDocs, createdAt.

The design template at `design-template-app/.../src/routes/admin.users.tsx` shows the exact layout.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template
- Real CRUD operations via API
- Form validation with Zod (email, name required, password min 8 on create, optional on edit)
- Error handling for API responses (email conflict, last-admin guards)
- Optimistic updates for smooth UX

**Non-Goals:**
- Password strength meter
- User search/filter (small user list)
- Pagination

## Decisions

### Decision: React Hook Form + Zod for user form

Create/edit form validated with Zod. Create schema: name (required), email (required, valid email), password (required, min 8), role (enum), canRestrictDocs (boolean). Edit schema: same but password is optional (empty = don't change).

### Decision: Single UserForm component for create and edit

The UserForm component accepts `user: UserPublic | null` — null means create mode, non-null means edit mode. Password field placeholder changes accordingly. This matches the design template pattern.

### Decision: Sheet slide-over (not modal)

Use shadcn Sheet with `side="right"`, `max-w-[400px]` for the create/edit form. This keeps the table visible in the background, matching the design template.

### Decision: Role toggle as segmented control

The role selector is a custom segmented control (USER | ADMIN buttons), not a select dropdown. Matches the design template exactly.

### Decision: AlertDialog for delete confirmation

Delete shows an AlertDialog with the user's name, explaining that documents won't be deleted but access is revoked immediately. Uses destructive-colored "Remove" button.

## Risks / Trade-offs

- **Last-admin error handling** — The API returns 400 when trying to delete/downgrade the last admin. The UI should display this error in a toast or alert. Mitigation: catch the error and show a user-friendly message.
- **Self-delete prevention** — The current user cannot delete themselves. The Delete button could be hidden or disabled for the current user's row.

## Migration Plan

1. Create user CRUD API hooks
2. Create UserForm component
3. Create users page with table and mobile cards
4. Add Sheet for create/edit
5. Add AlertDialog for delete
6. Typecheck
