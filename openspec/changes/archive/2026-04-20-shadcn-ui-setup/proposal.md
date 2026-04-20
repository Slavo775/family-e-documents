## Why

`packages/ui` currently contains a hand-rolled Button component with no design system foundation. The frontend (`app/web`) uses Tailwind but has no shared component primitives, leading to ad-hoc styling and duplicated form markup. Bootstrapping shadcn/ui in `packages/ui` gives all apps a consistent, accessible component set from the start.

## What Changes

- Initialize shadcn/ui in `packages/ui` via `npx shadcn@latest init` (default style, Tailwind CSS, `@` alias → `src/`)
- Add `components.json` to `packages/ui`
- Replace the existing hand-rolled Button with the shadcn-generated one
- Add shadcn components: Input, Label, Card (+ CardHeader, CardContent, CardFooter), Form (+ FormField, FormItem, FormLabel, FormControl, FormMessage), Alert
- Update `packages/ui/src/index.ts` to re-export all base components
- Add shadcn MCP server entry to `.claude/settings.json` pointing at `packages/ui`

## Capabilities

### New Capabilities
- `shadcn-ui-setup`: Initialize shadcn/ui in `packages/ui` with a base component set and MCP server integration for registry-based component generation

### Modified Capabilities
<!-- No existing capability specs are changing at the requirement level -->

## Non-goals

- Building page-level UI or wiring components into `app/web` screens
- Adding non-base shadcn components (e.g., DataTable, Calendar, Combobox)
- Theming or token customisation beyond shadcn defaults
- Storybook or visual regression testing setup

## Impact

- `packages/ui`: adds `components.json`, new component files under `src/components/`, updated `src/index.ts`
- `app/web`: no import changes required — existing `{ Button }` import continues to work
- `.claude/settings.json`: new `mcpServers` entry for `@shadcn/mcp`
- New dev dependency: `shadcn` (CLI), existing peer deps (`tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) added if not already present
