## 1. Populate shared config package

- [x] 1.1 Add ESLint peer dependencies to `packages/config-eslint/package.json` (eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint-config-next as optional peer)
- [x] 1.2 Implement `packages/config-eslint/base.js` with security rules (`no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` as errors) and `no-console` as warn, with TypeScript parser config
- [x] 1.3 Implement `packages/config-eslint/nextjs.js` that spreads base config and adds `eslint-config-next` rules
- [x] 1.4 Add `"lint"` script to `packages/config-eslint/package.json` that lints its own source (or a no-op if there is no src/)

## 2. Add ESLint configs to packages

- [x] 2.1 Create `packages/types/.eslintrc.js` extending `@family-docs/config-eslint/base`
- [x] 2.2 Add `"lint": "eslint src --ext .ts"` script to `packages/types/package.json`
- [x] 2.3 Create `packages/ui/.eslintrc.js` extending `@family-docs/config-eslint/base`
- [x] 2.4 Add `"lint": "eslint src --ext .ts,.tsx"` script to `packages/ui/package.json`

## 3. Add ESLint configs to apps

- [x] 3.1 Create or update `app/api/.eslintrc.js` extending `@family-docs/config-eslint/base`
- [x] 3.2 Add `"lint": "eslint src --ext .ts"` script to `app/api/package.json` (if missing)
- [x] 3.3 Create or update `app/web/.eslintrc.js` (or `.eslintrc.json`) extending `@family-docs/config-eslint/nextjs`
- [x] 3.4 Add `"lint": "next lint"` or `"lint": "eslint src --ext .ts,.tsx"` script to `app/web/package.json` (if missing)

## 4. Wire up root and verify

- [x] 4.1 Confirm every workspace is listed in `pnpm-workspace.yaml` so `pnpm --filter "*" lint` reaches all of them
- [x] 4.2 Run `pnpm --filter "*" lint` from the repo root and confirm no "no ESLint config found" errors
- [x] 4.3 Confirm `no-eval` is reported as an error by adding a temporary `eval("")` in any workspace, running lint, then removing it
