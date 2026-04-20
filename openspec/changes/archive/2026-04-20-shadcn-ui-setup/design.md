## Context

`packages/ui` has been scaffolded with empty placeholder files: `components.json`, `tailwind.config.ts`, component stubs under `src/components/ui/`, and an empty `src/index.ts`. All shadcn peer dependencies (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-label`) are already declared in `package.json`.

The goal is to fill these files with real shadcn-generated content and wire up the index exports and MCP server.

## Goals / Non-Goals

**Goals:**
- Populate `components.json` with a valid shadcn init configuration
- Fill `tailwind.config.ts` with the shadcn-compatible Tailwind setup
- Populate all six component files (button, input, label, card, form, alert) with real shadcn source
- Export all components from `src/index.ts`
- Register the shadcn MCP server in `.claude/settings.json`

**Non-Goals:**
- Running `npx shadcn@latest init` interactively (files are pre-scaffolded; we populate directly)
- Adding Radix UI primitives beyond what the six components require
- Custom theming, CSS variable overrides, or dark mode tokens
- Integrating components into `app/web` pages

## Decisions

### Decision: Populate files manually rather than running the shadcn CLI

The scaffold already has empty files in place. Running `shadcn init` interactively would prompt for config and risk overwriting `package.json` or `tsconfig.json`. Instead we write `components.json` with the correct config and copy the standard shadcn component implementations directly.

**Alternative considered**: Running `npx shadcn@latest add button input ...` after `init`. This works but requires network access and CLI availability at task time; the output is deterministic for these stable base components so inlining it is simpler.

### Decision: Use `src/lib/utils.ts` for the `cn()` utility

shadcn expects a `cn` helper at the path configured in `components.json` (`aliases.utils`). We set `aliases.utils` to `@/lib/utils` and populate `src/lib/utils.ts` with the standard `clsx` + `tailwind-merge` implementation.

### Decision: `@` alias points to `src/`

Matches the spec requirement and the standard shadcn convention for Next.js. The `tsconfig.json` path alias `"@/*": ["./src/*"]` is assumed to already be set (common in the scaffold); if not it must be added.

### Decision: MCP server uses `npx` invocation

`.claude/settings.json` will add an entry under `mcpServers` that runs `npx -y @shadcn/mcp --cwd packages/ui`. This avoids a hard dev dependency on the MCP package.

## Risks / Trade-offs

- **shadcn component source drift** → The inlined component code targets the versions of Radix primitives already installed. If a future `shadcn add` regenerates a component, it may differ. Mitigation: the MCP server makes future additions authoritative.
- **`@` alias not configured in tsconfig** → TypeScript will fail to resolve `@/lib/utils` imports inside `packages/ui`. Mitigation: verify `tsconfig.json` paths before closing the task.
- **`tailwind.config.ts` content** → shadcn requires the `darkMode: "class"` setting and the `content` glob to include component paths. If the existing `tailwind.config.ts` in `app/web` doesn't inherit from `packages/ui`, there's no conflict — each package owns its own config.

## Migration Plan

1. Write `components.json` to `packages/ui`
2. Write `tailwind.config.ts` with shadcn-compatible config
3. Write `src/lib/utils.ts` with `cn()` helper
4. Populate each component file under `src/components/ui/`
5. Update `src/index.ts` to re-export all components
6. Add MCP server entry to `.claude/settings.json`
7. Run `pnpm typecheck` in `packages/ui` to verify

No runtime migration needed — `app/web` has no existing imports of `@family-docs/ui` to update.
