## Why

The `packages/ui` package has only a single hand-rolled Button component, the web app has no error boundaries, ESLint is not enforced across all packages, and the login page uses raw `<input>` elements without the shared design system. This change lays the proper foundation for a consistent, secure, and maintainable frontend.

## What Changes

- Install and configure shadcn/ui in `packages/ui`, including the shadcn MCP server for registry-based component generation
- Add base shadcn components to `packages/ui` (Input, Label, Card, Form, Alert) and export them from the package index
- Replace raw HTML elements in `app/web` login page with shadcn components from `packages/ui`
- Add React error boundaries to `app/web` — root-level and route-level — with `console.error` reporting (ready to swap for a real logger)
- Audit and fix ESLint configuration across all apps and packages (`app/web`, `app/api`, `packages/ui`, `packages/types`, `packages/config-eslint`)
- Fix security issues found in the login flow (error message leakage, missing CSRF protection, missing rate limiting signal, input validation gaps)

## Capabilities

### New Capabilities

- `shadcn-ui-setup`: Configure shadcn/ui in `packages/ui`, add MCP registry support, add base component set (Button, Input, Label, Card, Form, Alert), export all from index
- `frontend-error-boundaries`: Root and route-level React error boundaries in `app/web` with `console.error` reporting
- `eslint-unified-config`: Consistent, enforced ESLint config across all packages and apps using the shared `packages/config-eslint` baseline

### Modified Capabilities

- `auth`: Login page migrated to shadcn components; security hardening applied (input validation with Zod, no credential leak in error messages, CSRF token awareness, password field autocomplete attribute)

## Impact

- `packages/ui`: `package.json` gains shadcn CLI and peer deps; new component files; updated `index.ts` exports
- `app/web`: login page, layout, and any existing page components updated to use `@family-docs/ui`; new `error.tsx` and `global-error.tsx` boundary files; `eslint.config.*` updated
- `packages/config-eslint`: baseline rules reviewed and tightened
- `app/api`: ESLint config verified/fixed, no runtime changes
- No API, database, or shared types changes

## Non-goals

- Building out the full dashboard or document upload UI (future change)
- Adding a real error reporting service (Sentry, etc.) — `console.error` only for now
- Server-side rate limiting implementation — that belongs in the API change
- Replacing NextAuth.js configuration or adding new auth providers
