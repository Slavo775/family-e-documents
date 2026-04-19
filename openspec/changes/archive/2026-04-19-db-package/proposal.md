## Why

The API app currently has no database layer. Before any feature work can begin (auth, folders, documents), a shared `packages/db` package must exist that owns the Prisma schema, client, migrations, and dev seed data — keeping database concerns out of the application layer and enabling future workspace packages to share the client.

## What Changes

- New monorepo package `packages/db` containing:
  - Prisma schema modelling the full family e-documents domain
  - Prisma client (generated into `src/generated/`)
  - `prisma.config.ts` for per-environment datasource config
  - Database scripts: generate, migrate dev, migrate deploy, push, studio, seed
  - Dev seed: factories + seed script that populates realistic test data
  - Audit middleware extension (Prisma query extension for create/update/delete logging)
- `app/api` updated to import `PrismaClient` from `@family-docs/db` instead of installing Prisma directly
- Environment variable `DATABASE_URL` wired into docker-compose and `.env` files for dev/stage/prod

## Capabilities

### New Capabilities

- `db-package`: Standalone Prisma database package — schema, client, migrations, audit extension, dev factories, and seed script

### Modified Capabilities

_(none — no existing specs)_

## Impact

- New package: `packages/db` — added to pnpm workspace
- `app/api`: adds `@family-docs/db` as a workspace dependency; removes any direct Prisma dependency
- New dev-only deps: `bcryptjs`, `tsx`, `@faker-js/faker` (for factories)
- `docker-compose.yaml`: Postgres service already present — no change needed
- `.env` / `.env.example` files: `DATABASE_URL` must be present in root and `packages/db`

## Non-goals

- No NestJS `PrismaModule` or service wrapper — that belongs in `app/api` as part of the auth or infrastructure change
- No Prisma Studio deployment to production
- No data backup / restore scripts
- No multi-tenancy or row-level security at this stage
