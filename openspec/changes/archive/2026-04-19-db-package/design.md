## Context

The project spec defines PostgreSQL + Prisma as the data layer, but no database package exists yet. The NestJS API will need a `PrismaClient` to access the database; rather than install Prisma inside `app/api`, we extract it into a dedicated workspace package (`packages/db`) — the same pattern used in `admin-portal-lab`. This keeps all schema/migration concerns in one place and lets future packages (e.g., a CLI tool or a worker) share the same client without duplicating configuration.

## Goals / Non-Goals

**Goals:**
- Create `packages/db` as an independently buildable pnpm workspace package
- Own the Prisma schema, migrations, generated client, and seed scripts
- Provide dev-only factories for test data generation
- Wire the package into `app/api` as a workspace dependency
- Support three environments: `dev` (local Docker Postgres), `stage` and `prod` (same external Postgres config, distinguished only by `DATABASE_URL`)

**Non-Goals:**
- No NestJS `PrismaModule` / injectable service — that is the API's concern (done in `02-auth` or an infra change)
- No database backup, restore, or archival scripts
- No Prisma Studio deployment to non-dev environments
- No multi-tenancy / row-level security

## Decisions

### 1. Package name: `@family-docs/db`
Keeps imports concise. Readable in the API: `import { PrismaClient } from '@family-docs/db'`.

**Alternatives considered:** naming it `@family-e-documents/prisma` — rejected; "db" is more general and allows future non-Prisma exports (e.g., raw pg pool).

### 2. Prisma adapter: `@prisma/adapter-pg` + `pg`
The reference project uses the PrismaClient Postgres adapter (`PrismaPg`) rather than the built-in connector. This enables the native `pg` driver and connection pooling at the adapter layer, which is the current Prisma recommendation for production Postgres deployments.

**Alternatives considered:** built-in Prisma connector (no adapter) — simpler setup but loses connection pool control; kept for later if adapter causes issues.

### 3. Generated client location: `src/generated/prisma/`
Mirrors the reference project. Prisma generates into `src/generated/` rather than `node_modules`, so the generated types are committed to source control (or at least checked-in during CI) and the `exports` map in `package.json` can point to a predictable path.

### 4. Environment configuration: single `DATABASE_URL` per env
`dev`, `stage`, and `prod` differ only in the value of `DATABASE_URL`. `prisma.config.ts` reads from `env('DATABASE_URL')`. No environment-branching logic in the config file. The difference between stage and prod is purely which `.env` file (or secret manager entry) is active at deploy time.

**Alternatives considered:** separate `schema.prisma` per env — overengineering for a family app; rejected.

### 5. Seed strategy: factories + single `seed.ts` entry point
Factories produce deterministic, overridable in-memory objects (same pattern as `admin-portal-lab`). The seed script wires them together to upsert data so it is idempotent and safe to re-run. Dev seed includes: admin user, one regular user, root folder tree (as defined in project spec), and a handful of sample documents.

**Alternatives considered:** fixture JSON files — harder to compose and generate cuid2 IDs; rejected.

### 6. Audit Prisma extension: lives in `packages/db`
The Prisma query extension that logs create/update/delete operations belongs in `packages/db` alongside the client. The API activates it by calling `createAuditExtension(...)` when instantiating its client. This keeps audit logic database-adjacent and testable independently of NestJS.

## Risks / Trade-offs

- **Generated files in source control** → `src/generated/` is gitignored by default in some setups; we must ensure it is NOT gitignored (or that CI runs `db:generate` before build). Mitigation: add a `postinstall` script or note in CLAUDE.md.
- **Prisma version pinning** → Prisma releases frequently; `@prisma/client` and `prisma` must stay in sync (same version). Mitigation: pin to an exact version in `package.json` and use `pnpm` catalog if available.
- **`bcryptjs` in devDependencies only** → Factories use bcrypt for hashing passwords. In the API the hash will be done by the auth layer, not by the db package. Ensure `bcryptjs` is dev-only here.

## Migration Plan

1. Create `packages/db` directory and files
2. Run `pnpm install` from repo root to resolve workspace links
3. Run `pnpm --filter @family-docs/db db:generate` to generate Prisma client
4. Run `pnpm --filter @family-docs/db db:migrate:dev --name init` to create initial migration
5. Run `pnpm --filter @family-docs/db db:seed` to populate dev database
6. Add `@family-docs/db` to `app/api/package.json` dependencies
7. Verify `app/api` builds without Prisma installed directly

**Rollback:** remove the `packages/db` directory and revert `app/api/package.json`. No schema migrations have been deployed to shared environments at this stage.

## Open Questions

- Should `src/generated/` be committed to git or regenerated in CI? (Recommend: commit, same as reference project — simplifies CI setup for a private family repo.)
- Should the seed be protected by an environment guard (`if (process.env.NODE_ENV !== 'production')`)? Recommend yes — but left for implementation to confirm.
