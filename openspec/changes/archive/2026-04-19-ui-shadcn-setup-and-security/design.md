## Context

The project already has shadcn/ui listed as a tech stack dependency, but `packages/ui` contains only a hand-rolled Button component and no shadcn CLI setup. The web app (`app/web`) imports from `@family-docs/ui` but that package has no shadcn configuration, no `components.json`, and no MCP registry. Error boundaries are absent in `app/web`, ESLint configs exist in `packages/config-eslint` but are not consistently applied across all workspaces, and the login page uses raw `<input>` elements with minimal security hygiene.

## Goals / Non-Goals

**Goals:**
- Properly initialize shadcn/ui in `packages/ui` with `components.json` and the MCP server for registry-based generation
- Add the core component set (Button, Input, Label, Card, Form, Alert) to `packages/ui` and export from its index
- Replace raw HTML elements in `app/web`'s login page with shadcn components from `packages/ui`
- Add root and route-level React error boundaries to `app/web`
- Unify ESLint config across all apps and packages using the shared baseline
- Harden the login flow: generic error messages, proper autocomplete attributes, Zod validation on the client form

**Non-Goals:**
- Adding Sentry or any remote error reporting
- Server-side rate limiting (belongs in `app/api`)
- Migrating dashboard or document UI components (future change)
- Adding new auth providers or changing session strategy

## Decisions

### shadcn/ui lives in `packages/ui`, not in `app/web`

**Decision**: Configure shadcn in `packages/ui`, not directly in each app.

**Rationale**: The project spec already defines `packages/ui` as the shared component library. If shadcn were initialized in `app/web`, components would not be reusable by future apps (e.g., a mobile web client). The shadcn CLI supports `--cwd` to point at any package directory; all generated components land in `packages/ui/src/components/`.

**Alternative considered**: Initialize shadcn in each app separately. Rejected — duplicates components and breaks the single-source-of-truth for the design system.

### MCP server via `@shadcn/mcp` for registry-based generation

**Decision**: Add `@shadcn/mcp` as a dev tool so Claude Code can use the shadcn registry MCP server to add components without manually running CLI commands.

**Rationale**: The shadcn MCP server (https://ui.shadcn.com/docs/registry/mcp) exposes registry tools as MCP tools, enabling component generation directly from the AI assistant. This accelerates future component additions and keeps them consistent with registry versions.

**How**: Add an MCP server entry to `.claude/settings.json` pointing at `npx @shadcn/mcp --cwd packages/ui`.

### Error boundaries — two levels

**Decision**: Two boundaries: a root `global-error.tsx` (App Router convention) and a route-level `error.tsx` in each route segment that needs isolation.

**Rationale**: Next.js App Router distinguishes between layout-level errors (need `global-error.tsx` at the root) and segment-level errors (`error.tsx`). Using both prevents a broken route from crashing the entire shell. Only `console.error` for now — easy to swap for a real logger.

**Alternative considered**: A single HOC wrapper. Rejected — doesn't integrate with Next.js App Router conventions and misses layout-level crashes.

### ESLint: extend shared baseline, fix per-package overrides

**Decision**: All packages and apps extend `@family-docs/config-eslint/base` (or `nextjs` for `app/web`). Each workspace may add rules but cannot weaken the shared baseline.

**Rationale**: `packages/config-eslint` already has `base.js` and `nextjs.js`. Several workspaces either don't have an ESLint config at all or use a different format. Standardize on flat config (`eslint.config.mjs`) where the runtime supports it; use legacy `.eslintrc.js` only where required by the toolchain.

### Login security: generic error + client Zod validation

**Decision**: The login form always shows "Invalid credentials" regardless of whether email or password failed. Client-side Zod validation runs before the `signIn` call to avoid unnecessary network requests for obviously invalid input. Password field gets `autocomplete="current-password"`.

**Rationale**: Distinct "email not found" vs "wrong password" messages are an enumeration vector. Client validation with Zod (already a stack dependency) catches empty/malformed inputs cheaply. `autocomplete="current-password"` enables password managers and is a WCAG/security best-practice.

**Not changed**: CSRF protection is handled by NextAuth.js internally for its credentials provider. No additional CSRF token wiring needed on the client.

## Risks / Trade-offs

- **shadcn peer deps in packages/ui** → shadcn components depend on Radix UI primitives and `class-variance-authority`. These become dependencies of `packages/ui`, which apps must also install transitively. Mitigation: pnpm workspace hoisting handles this automatically; no duplication.
- **components.json path assumptions** → shadcn `components.json` uses path aliases. If `app/web`'s `tsconfig.json` path aliases differ from `packages/ui`'s, imports may break. Mitigation: verify `@` alias in both configs points to the correct `src/` directory before running the CLI.
- **Flat ESLint config (v9) vs legacy** → some tooling (e.g., older Jest plugins) still requires legacy config format. Mitigation: use flat config only where Next.js and NestJS fully support it; fall back to `.eslintrc.js` in `app/api` if needed.

## Migration Plan

1. Initialize shadcn in `packages/ui` (`npx shadcn@latest init --cwd packages/ui`)
2. Add MCP server config to `.claude/settings.json`
3. Add base components: Button (replace existing), Input, Label, Card, Form, Alert
4. Update `packages/ui/src/index.ts` to export all new components
5. Update `app/web` login page to use shadcn components + Zod validation
6. Add `app/web/src/app/error.tsx` and `global-error.tsx`
7. Audit and update ESLint configs in all workspaces
8. Verify `pnpm lint` passes everywhere

Rollback: all changes are frontend-only with no DB or API changes. Git revert is sufficient.

## Open Questions

- Should `packages/ui/components.json` use the `default` or `new-york` shadcn style? (Recommend `default` to match existing button styling)
- Does `app/api` have ESLint running in CI? If not, that should be added as part of this change.
