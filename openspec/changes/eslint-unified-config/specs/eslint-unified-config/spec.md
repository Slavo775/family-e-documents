## ADDED Requirements

### Requirement: All workspaces have an ESLint config
Every app and package (`app/web`, `app/api`, `packages/ui`, `packages/types`, `packages/config-eslint`) SHALL have an ESLint configuration file. No workspace SHALL be missing a config.

#### Scenario: Running pnpm lint at the root succeeds
- **WHEN** a developer runs `pnpm --filter "*" lint` from the monorepo root
- **THEN** all workspaces execute their lint script without "no ESLint config found" errors

### Requirement: All workspaces extend the shared baseline
Every workspace's ESLint config SHALL extend either `@family-docs/config-eslint/base` (for non-Next.js workspaces) or `@family-docs/config-eslint/nextjs` (for `app/web`).

#### Scenario: Shared rule enforced everywhere
- **WHEN** a developer writes `console.log` in `packages/types/src/index.ts`
- **THEN** the lint step flags it as a warning (per shared baseline rule `no-console`)

### Requirement: packages/config-eslint baseline includes security rules
`packages/config-eslint/base.js` SHALL include at minimum: `no-eval`, `no-implied-eval`, `no-new-func`, and `no-script-url` as errors.

#### Scenario: Eval usage is flagged
- **WHEN** a developer writes `eval(userInput)` anywhere in the codebase
- **THEN** ESLint reports it as an error

### Requirement: Each workspace has a lint script
Every workspace `package.json` SHALL have a `"lint"` script. Apps SHALL use `eslint src --ext .ts,.tsx` (or equivalent for flat config). Packages SHALL lint their `src/` directory.

#### Scenario: lint script runs without configuration error
- **WHEN** a developer runs `pnpm lint` inside any single workspace
- **THEN** the command exits 0 with no config errors (lint warnings/errors from code are acceptable)
