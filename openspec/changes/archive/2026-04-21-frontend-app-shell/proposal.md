## Why

The `app/web` frontend has no authenticated layout shell — there's a bare `app/layout.tsx`, a placeholder `app/dashboard/page.tsx`, and NextAuth wired up, but no sidebar, topbar, breadcrumbs, folder tree, or user context provider. Every authenticated page in the design template shares the same AppShell wrapper (`SidebarProvider` + `FamilySidebar` + `SidebarInset` with sticky topbar), so this must be built first before any feature pages can be implemented.

## What Changes

- Create a `(app)` Next.js route group with a layout that wraps all authenticated pages in the AppShell
- Implement `FamilySidebar` component (logo, folder tree, admin nav links, user footer with sign-out)
- Implement `FolderTree` recursive collapsible component (used in sidebar, permissions page, upload dialog)
- Implement sticky topbar (sidebar trigger, breadcrumbs, search input, notification bell, user avatar)
- Create shared helper components: `FamilyLogo`, `UserAvatar`, `FileTypeIcon`, `TagChip`
- Add an `AuthProvider` / user context that fetches the current session and provides user data to all child components
- Add API client utility (`lib/api.ts`) for making authenticated requests to the NestJS backend
- Install required shadcn/ui components: Sidebar, Separator, Avatar, DropdownMenu, Tooltip, Sheet

## Design Template References

These files from `design-template-app/family-docs-design-hub-main/` define the visual spec:

| Design file | What it defines |
|---|---|
| `src/components/family/app-shell.tsx` | AppShell layout: SidebarProvider + FamilySidebar + SidebarInset, sticky topbar with breadcrumbs/search/bell/avatar |
| `src/components/family/family-sidebar.tsx` | FamilySidebar: logo header, "My Files" folder tree, "Admin" nav links, user footer with sign-out |
| `src/components/family/folder-tree.tsx` | FolderTree: standalone recursive collapsible tree (used outside sidebar too) |
| `src/components/family/logo.tsx` | FamilyLogo: brand logo with optional text |
| `src/components/family/avatar.tsx` | UserAvatar: colored initials avatar with size variants |
| `src/components/family/file-icon.tsx` | FileTypeIcon: icon per file kind (pdf, image, doc, sheet, other) |
| `src/components/family/tag.tsx` | TagChip: small tag pill with optional remove button |
| `src/lib/mock-data.ts` | Mock data shapes: MockUser, MockDoc, FolderNode, folder tree structure |

## Capabilities

### New Capabilities
- `frontend-app-shell`: Authenticated layout shell with collapsible sidebar, folder tree navigation, topbar with breadcrumbs/search, and user context

### Modified Capabilities
<!-- None -->

## Non-goals

- Implementing actual search functionality (the search input is a placeholder — wired up in a later change)
- Notification system (bell icon is static)
- Actual folder data fetching from API (uses placeholder/static tree for now, will be connected in files changes)
- Dark mode toggle (follow system preference only for now)
- Mobile bottom navigation (sidebar collapse handles mobile)

## Impact

- `app/web/src/app/(app)/layout.tsx`: new route group layout wrapping authenticated pages
- `app/web/src/components/family/`: new directory with AppShell, FamilySidebar, FolderTree, FamilyLogo, UserAvatar, FileTypeIcon, TagChip
- `app/web/src/lib/api.ts`: new API client utility
- `app/web/src/contexts/auth-context.tsx`: new auth/user context provider
- `app/web/src/app/dashboard/page.tsx`: moved into `(app)` group
- `packages/ui`: new shadcn components added (Sidebar, Separator, Avatar, DropdownMenu, Tooltip, Sheet)
