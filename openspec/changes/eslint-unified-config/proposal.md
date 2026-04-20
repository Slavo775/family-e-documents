## Why

The monorepo currently lacks a consistent ESLint setup across workspaces: some have no config at all, and no shared baseline enforces security or style rules uniformly. This creates gaps where unsafe patterns (e.g., `eval`, `console.log`) go uncaught in some packages while flagged in others.

## What Changes

- Add `packages/config-eslint` with a shared `base.js` config (security rules, no-console) and a `nextjs.js` extension
- Add or fix `eslint.config.js` / `.eslintrc.js` in every workspace (`app/web`, `app/api`, `packages/ui`, `packages/types`, `packages/config-eslint`) to extend the shared baseline
- Add a `"lint"` script to every workspace `package.json` that targets its `src/` directory
- Wire up `pnpm --filter "*" lint` at the root to run all workspace lint scripts

## Non-goals

- Introducing new lint rules beyond the shared security baseline (no-eval, no-implied-eval, no-new-func, no-script-url) and `no-console`
- Migrating to ESLint flat config format — use the format already present or the most compatible format per workspace
- Fixing pre-existing lint violations (only config, not cleanup)

## Capabilities

### New Capabilities
- `eslint-unified-config`: Shared ESLint baseline package and per-workspace configs so every workspace lints consistently with security rules enforced

### Modified Capabilities

## Impact

- `packages/config-eslint/package.json`, `base.js`, `nextjs.js` — new shared config package
- Every workspace `package.json` — adds `"lint"` script
- Every workspace — adds or updates ESLint config file
- Root `package.json` — no change needed (filter command works via pnpm workspaces)
