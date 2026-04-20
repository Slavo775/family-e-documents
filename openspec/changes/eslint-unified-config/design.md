## Context

The monorepo has five workspaces (`app/web`, `app/api`, `packages/ui`, `packages/types`, `packages/config-eslint`) plus a stub `packages/config-eslint` that already exists but is empty. Without a shared baseline, security-sensitive rules aren't consistently enforced. `pnpm --filter "*" lint` will either fail or skip workspaces that have no `lint` script or ESLint config.

## Goals / Non-Goals

**Goals:**
- Populate `packages/config-eslint` with `base.js` and `nextjs.js` exports
- Add ESLint config to every workspace that extends the appropriate shared preset
- Add a `"lint"` script to every workspace `package.json`
- Ensure `pnpm --filter "*" lint` exits 0 (no config errors)

**Non-Goals:**
- Fixing pre-existing lint violations
- Migrating any workspace to ESLint flat config
- Adding rules beyond the agreed baseline

## Decisions

**Shared config format — CommonJS exports in `packages/config-eslint`**
Both `app/api` (NestJS) and `packages/*` use CommonJS-compatible setups. `base.js` exports a plain config object; `nextjs.js` spreads base and adds `eslint-config-next` rules. Rationale: lowest friction; no transpilation needed; already the de-facto pattern for shared ESLint configs in monorepos.

**Per-workspace config style — `.eslintrc.js` with `extends`**
Each workspace uses the legacy `extends` format (`.eslintrc.js` or `.eslintrc.json`) rather than flat config. Rationale: `app/web` uses `eslint-config-next` which still ships a legacy config; mixing flat and legacy in the same repo adds complexity without benefit at this stage.

**Security rule set — four rules as `"error"`**
`no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` are all set to `"error"` in `base.js`. `no-console` is set to `"warn"`. These four rules cover the most common dynamic code execution vectors and are zero-false-positive for a typed backend/frontend with no intentional dynamic eval.

**`app/api` — uses `base.js`; `app/web` — uses `nextjs.js`**
`app/api` is a NestJS backend; it has no JSX or Next.js–specific rules to enforce. `app/web` extends `nextjs.js` which internally extends `base.js`, so the security rules are inherited.

## Risks / Trade-offs

- **`eslint-config-next` peer dep version** → The version pinned in `packages/config-eslint/package.json` must match or be compatible with the version used in `app/web`. Mitigation: use `"*"` or a wide range peer dep in `packages/config-eslint`.
- **Empty `packages/config-eslint` currently** → The package already exists but `base.js` and `nextjs.js` are empty files. Implementation must populate them; any workspace that already tried to extend them would have silently loaded an empty object. No migration needed beyond filling in the files.
- **`no-console` as warn (not error)** → Developers may ignore warnings. Mitigation: acceptable tradeoff — NestJS uses its own Logger; warning on console is sufficient signal without breaking builds.
