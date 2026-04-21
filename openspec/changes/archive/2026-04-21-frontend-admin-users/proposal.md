## Why

The admin needs a UI to manage family member accounts. The design template shows a user management page at `/admin/users` with a table (desktop) / card list (mobile) displaying user name, email, role badge, canRestrict flag, creation date, and edit/delete actions. A Sheet slide-over form handles both creating and editing users. Deletion has an AlertDialog confirmation.

The backend `Users` API is fully implemented (`GET /api/v1/users`, `POST`, `PATCH /:id`, `DELETE /:id`) from the `users` openspec change.

## What Changes

- Create `/admin/users` page at `app/(app)/admin/users/page.tsx`
- Desktop table: name + avatar, email, role badge (ADMIN=highlighted, USER=outline), canRestrict check/dash, created date, Edit link + Delete icon
- Mobile card list: avatar + name + email, role badge, restrict flag + date, edit/delete
- "Create User" button → Sheet form
- Sheet form: Full Name, Email, Password, Role toggle (USER/ADMIN), Can Restrict Documents switch
- Edit: same Sheet pre-filled with user data
- Delete: AlertDialog confirmation with descriptive message
- Wire to backend CRUD API via TanStack Query mutations

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/admin.users.tsx` | Full users page: UsersPage (table + cards + Sheet + AlertDialog), UserForm (name/email/password/role/canRestrict) |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar used in table rows and form |
| `design-template-app/.../src/lib/mock-data.ts` | MockUser shape: id, name, email, initials, color, role, canRestrict, createdAgo |

## Capabilities

### New Capabilities
- `frontend-admin-users`: Admin user management page with CRUD operations, role management, and canRestrict toggle

### Modified Capabilities
<!-- None -->

## Non-goals

- Self-service profile editing (admin-only page)
- Password strength indicator
- User invitation emails
- User activity / last login display
- Bulk user operations

## Impact

- `app/web/src/app/(app)/admin/users/page.tsx`: new page
- `app/web/src/lib/api/users.ts`: TanStack Query hooks for user CRUD
- Dependencies: `frontend-app-shell` (AppShell, UserAvatar)
- shadcn: Table, Badge, Sheet, AlertDialog, Switch, Card (should be available from previous changes)
- Backend: uses existing `GET/POST/PATCH/DELETE /api/v1/users` endpoints
