## Context

The Next.js app at `app/web/` currently has:
- `app/layout.tsx` (root layout with providers)
- `app/providers.tsx` (QueryClientProvider + SessionProvider)
- `app/login/page.tsx` (login page)
- `app/dashboard/page.tsx` (placeholder)
- `lib/auth.ts` (NextAuth config with credentials provider)
- `middleware.ts` (auth redirect middleware)

The design template uses TanStack Router; we're converting to Next.js App Router. The `AppShell` in the design is a client component wrapping `SidebarProvider` → `FamilySidebar` + `SidebarInset`. The sidebar uses shadcn's `Sidebar` component system.

`packages/ui/` has shadcn initialized but only has Button, Input, Label, Card, Form, Alert so far.

## Goals / Non-Goals

**Goals:**
- Pixel-accurate reproduction of the design template's AppShell layout
- FolderTree as a standalone reusable component (needed by sidebar, permissions page, upload dialog)
- Auth context that provides current user data (from NextAuth session + API)
- API client with automatic token injection for backend calls
- All helper components (Logo, Avatar, FileTypeIcon, TagChip) as shared components

**Non-Goals:**
- Live folder data from API (static tree for now)
- Search functionality (placeholder input only)
- Notification system

## Decisions

### Decision: Route group `(app)` for authenticated layout

All authenticated pages go under `app/(app)/`. This route group applies the AppShell layout automatically. The login page stays outside at `app/login/page.tsx`. This matches Next.js App Router conventions for shared layouts.

### Decision: FolderTree fetches from API in a future change

The sidebar folder tree will use a static placeholder array initially. A future `frontend-files-grid` or dedicated change will wire it to `GET /api/v1/folders/tree`. This avoids coupling the shell to the folders API before it's integrated.

### Decision: shadcn Sidebar component from packages/ui

Install shadcn's `sidebar` component into `packages/ui` alongside existing components. The AppShell imports from `@family-docs/ui/sidebar`. This keeps UI components centralized.

### Decision: API client in lib/api.ts

A thin fetch wrapper in `app/web/src/lib/api.ts` that:
1. Reads the session token from NextAuth
2. Sets `Authorization: Bearer <token>` header
3. Handles JSON parsing and error responses
4. Base URL from `NEXT_PUBLIC_API_URL` env var

### Decision: Helper components in app/web, not packages/ui

`FamilyLogo`, `UserAvatar`, `FileTypeIcon`, `TagChip` are app-specific (they use domain concepts like file kinds and roles). They go in `app/web/src/components/family/`, not in `packages/ui`.

### Decision: Breadcrumb component receives segments as props

The AppShell topbar breadcrumb is driven by props (array of strings), not by Next.js route segments. Each page passes its own breadcrumb trail. This matches the design template pattern and is simpler than auto-deriving from the URL.

## Risks / Trade-offs

- **shadcn Sidebar is complex** — it has many sub-components (SidebarProvider, SidebarMenu, SidebarMenuButton, etc.). Installing it brings in a sizeable chunk. Mitigation: this is the standard shadcn pattern and matches the design template exactly.
- **Static folder tree** means the sidebar won't reflect real data until a later change. Mitigation: the FolderTree component accepts data as props, so swapping in API data is a prop change.

## Migration Plan

1. Install required shadcn components into `packages/ui`
2. Create helper components (FamilyLogo, UserAvatar, FileTypeIcon, TagChip)
3. Create FolderTree component
4. Create FamilySidebar component
5. Create AppShell (topbar + sidebar + content area)
6. Create `(app)` route group layout
7. Create AuthProvider / user context
8. Create API client utility
9. Move dashboard page into `(app)` group
