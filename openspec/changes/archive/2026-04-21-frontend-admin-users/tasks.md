## 1. API Hooks

- [x] 1.1 Create `app/web/src/lib/api/users.ts` with TanStack Query hooks:
  - `useUsers()`: `GET /api/v1/users` → `UserPublic[]`
  - `useCreateUser()`: mutation, `POST /api/v1/users`, invalidates users query
  - `useUpdateUser()`: mutation, `PATCH /api/v1/users/:id`, invalidates users query
  - `useDeleteUser()`: mutation, `DELETE /api/v1/users/:id`, invalidates users query

## 2. User Form Component

- [x] 2.1 Create `UserForm` component (can be in the page file or extracted) matching `design-template-app/.../src/routes/admin.users.tsx` UserForm:
  - Props: `user: UserPublic | null` (null = create), `onCancel`, `onSave`
  - Fields: Full Name input, Email input, Password input (placeholder varies by mode), Role segmented toggle (USER/ADMIN), Can Restrict Documents switch in a Card
  - SheetHeader with "Create User" / "Edit User" title
  - Footer: Cancel + Save buttons
  - Form validation with React Hook Form + Zod

## 3. Users Page

- [x] 3.1 Create `app/web/src/app/(app)/admin/users/page.tsx` matching `design-template-app/.../src/routes/admin.users.tsx`:
  - Wrapped in AppShell with breadcrumbs `["Admin", "User Management"]`
  - Header: "User Management" h1 + subtitle + "Create User" button
  - **Desktop table** (hidden sm:block): Card wrapping Table with columns: Name (UserAvatar + name), Email, Role (Badge — ADMIN with colored bg, USER with outline), Can Restrict (Check icon or Minus icon), Created (relative date), Actions (Edit link + Delete icon button)
  - **Mobile cards** (sm:hidden): Card with avatar + name + email, role badge, restrict + date, edit/delete buttons
  - Loading/error states for the useUsers() query

## 4. Sheet & AlertDialog

- [x] 4.1 Wire "Create User" button and Edit links to open Sheet with UserForm. On save, call create/update mutation, close sheet, show success
- [x] 4.2 Wire Delete button to open AlertDialog with user name, description "This will not delete their documents. They will lose access immediately and any active sessions will be revoked.", Cancel + destructive "Remove" button. On confirm, call delete mutation

## 5. Error Handling

- [x] 5.1 Handle API errors: email conflict (409) → show "Email already in use", last-admin guard (400) → show "Cannot delete/downgrade the last admin", self-delete (400) → show "Cannot delete your own account"

## 6. Verification

- [x] 6.1 Run typecheck and confirm zero errors
