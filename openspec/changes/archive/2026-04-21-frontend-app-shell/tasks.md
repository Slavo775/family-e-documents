## 1. shadcn/ui Components

- [x] 1.1 Install Sidebar component into `packages/ui` (`npx shadcn@latest add sidebar`)
- [x] 1.2 Install remaining required components: Separator, Avatar, DropdownMenu, Tooltip, Sheet (if not already present)
- [x] 1.3 Export all new components from `packages/ui/src/index.ts`

## 2. Helper Components

- [x] 2.1 Create `app/web/src/components/family/family-logo.tsx` — brand logo with `size` prop (sm/lg) and optional `hideText`, matching `design-template-app/.../logo.tsx`
- [x] 2.2 Create `app/web/src/components/family/user-avatar.tsx` — colored initials avatar with size variants (xs/sm/md), matching `design-template-app/.../avatar.tsx`
- [x] 2.3 Create `app/web/src/components/family/file-type-icon.tsx` — icon per file kind (pdf/image/doc/sheet/other) with size variants, matching `design-template-app/.../file-icon.tsx`
- [x] 2.4 Create `app/web/src/components/family/tag-chip.tsx` — tag pill with optional `onRemove` callback, matching `design-template-app/.../tag.tsx`

## 3. Folder Tree

- [x] 3.1 Create `app/web/src/components/family/folder-tree.tsx` — standalone recursive collapsible folder tree component accepting `data`, `activeId`, `onSelect` props; matching `design-template-app/.../folder-tree.tsx`

## 4. Sidebar

- [x] 4.1 Create `app/web/src/components/family/family-sidebar.tsx` — collapsible sidebar using shadcn Sidebar components: logo header, "My Files" folder tree section, "Admin" nav links (Files, Explorer, Users, Permissions, Audit log), user footer with sign-out; matching `design-template-app/.../family-sidebar.tsx`. Convert TanStack Router `Link` to Next.js `Link`, `useRouterState` to `usePathname`

## 5. App Shell

- [x] 5.1 Create `app/web/src/components/family/app-shell.tsx` — main layout: `SidebarProvider` + `FamilySidebar` + `SidebarInset` with sticky topbar containing `SidebarTrigger`, breadcrumbs, search input (placeholder), notification bell (static), user avatar; matching `design-template-app/.../app-shell.tsx`. Convert TanStack Router patterns to Next.js

## 6. Auth & API Infrastructure

- [x] 6.1 Create `app/web/src/lib/api.ts` — fetch wrapper that reads session token from NextAuth, sets Authorization header, handles JSON/error responses, uses `NEXT_PUBLIC_API_URL`
- [x] 6.2 Create `app/web/src/contexts/auth-context.tsx` — React context providing current user data (from NextAuth session), `useAuth()` hook

## 7. Route Group & Layout

- [x] 7.1 Create `app/web/src/app/(app)/layout.tsx` — authenticated layout that wraps children in AppShell, redirects unauthenticated users to `/login`
- [x] 7.2 Move `app/web/src/app/dashboard/page.tsx` to `app/web/src/app/(app)/dashboard/page.tsx`
- [x] 7.3 Update root `app/page.tsx` to redirect authenticated users to `/files` (or `/dashboard` temporarily)

## 8. Verification

- [x] 8.1 Run typecheck (`pnpm --filter "app/web" typecheck` or `tsc --noEmit`) and confirm zero errors
