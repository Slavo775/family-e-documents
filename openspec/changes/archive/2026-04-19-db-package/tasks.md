## 1. Package Scaffold

- [x] 1.1 Create `packages/db/` directory with `package.json` (`@family-docs/db`, private, with `exports` map pointing to `dist/index.js`)
- [x] 1.2 Add `tsconfig.json` extending `@family-docs/config-ts/base.json` with `outDir: dist`, `rootDir: src`
- [x] 1.3 Add `.gitignore` excluding `dist/`, `node_modules/`, `src/generated/` (keep generated tracked by git)
- [x] 1.4 Add `.env` and `.env.example` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/family_docs`
- [x] 1.5 Verify `pnpm-workspace.yaml` includes `packages/*` glob (it should already)

## 2. Prisma Setup

- [x] 2.1 Install dependencies: `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg`, `dotenv` (prod); `tsx`, `bcryptjs`, `@faker-js/faker` (dev)
- [x] 2.2 Create `prisma/schema.prisma` with `generator client` configured to output `../src/generated/prisma`, datasource `db` pointing to `env("DATABASE_URL")`
- [x] 2.3 Add `User` model: `id` (cuid, `@id @default(cuid())`), `email` (unique), `passwordHash`, `name`, `role` (enum `Role`: ADMIN | USER), `canRestrictDocs` (Boolean, default false), `createdAt`, `updatedAt`
- [x] 2.4 Add `Folder` model: `id`, `name`, `parentId` (nullable, self-relation), `parent`/`children` relations, `createdById` → User, `createdAt`, `updatedAt`
- [x] 2.5 Add `FolderPermission` model: `folderId` + `userId` composite unique, `actions` (String[]), `inherited` (Boolean)
- [x] 2.6 Add `Document` model: `id`, `name`, `title`, `description`, `tags` (String[]), `folderId`, `fileKey`, `mimeType`, `sizeBytes`, `status` (enum `DocumentStatus`: PENDING | ACTIVE | DELETED), `visibility` (enum `Visibility`: PUBLIC | RESTRICTED), `allowedUserIds` (String[]), `uploadedById`, `createdAt`, `updatedAt`
- [x] 2.7 Add `AuditLog` model: `id`, `userId` (nullable), `method`, `path`, `statusCode`, `durationMs`, `ipAddress`, `userAgent`, `body` (Json?), `timestamp`
- [x] 2.8 Create `prisma.config.ts` using `defineConfig` reading `DATABASE_URL` from env
- [x] 2.9 Add `db:generate`, `db:push`, `db:migrate:dev`, `db:migrate:reset`, `db:migrate:deploy`, `db:studio`, `db:seed` scripts to `package.json`
- [x] 2.10 Run `pnpm --filter @family-docs/db db:generate` to generate client into `src/generated/`

## 3. Initial Migration

- [x] 3.1 Ensure Docker Compose Postgres is running (`docker compose up -d postgres`)
- [x] 3.2 Run `pnpm --filter @family-docs/db db:migrate:dev --name init` to create `prisma/migrations/`
- [x] 3.3 Verify migration applies cleanly and `prisma validate` passes

## 4. Public API (src/index.ts)

- [x] 4.1 Create `src/index.ts` re-exporting `PrismaClient`, `Prisma` from `./generated/prisma/client.js`
- [x] 4.2 Re-export all model types: `User`, `Folder`, `FolderPermission`, `Document`, `AuditLog`
- [x] 4.3 Re-export all enums: `Role`, `DocumentStatus`, `Visibility`
- [x] 4.4 Re-export `createAuditExtension` from `./middleware/audit.middleware.js`

## 5. Audit Middleware

- [x] 5.1 Create `src/middleware/audit.middleware.ts` with `createAuditExtension(auditedModels, getUserId?)` function using Prisma query extension
- [x] 5.2 Implement `create` operation logging: insert AuditLog with `action=CREATE`, `entity`, `entityId`, `changes` (stripped of sensitive fields)
- [x] 5.3 Implement `update` operation logging: compute diff between old and new record; insert AuditLog with `action=UPDATE` and diff as `changes`
- [x] 5.4 Implement `delete` operation logging: capture pre-delete record, insert AuditLog with `action=DELETE`
- [x] 5.5 Redact `passwordHash` (and any other sensitive fields) in all audit log `changes` JSON

## 6. Dev Factories

- [x] 6.1 Create `src/factories/User.ts` — `UserFactory` class with `generateDefaults()`, constructor overrides, and static `createAdmin()` helper (hashes password with bcrypt)
- [x] 6.2 Create `src/factories/Folder.ts` — `FolderFactory` class producing Folder objects with auto-incrementing names, optional `parentId`
- [x] 6.3 Create `src/factories/Document.ts` — `DocumentFactory` class producing Document objects with `status=ACTIVE`, `visibility=PUBLIC`, faker-generated `title`/`description`/`tags`
- [x] 6.4 Export all factories from `src/index.ts`

## 7. Dev Seed

- [x] 7.1 Create `src/seed.ts` — entry point that guards against `NODE_ENV=production` (exits non-zero with warning)
- [x] 7.2 Seed admin user (`admin@family.local` / `Admin123!`, `role=ADMIN`) using `UserFactory.createAdmin()` + upsert
- [x] 7.3 Seed regular user (`user@family.local` / `User123!`, `role=USER`) using `UserFactory` + upsert
- [x] 7.4 Seed root folder tree via upsert (by `name` + `parentId`): `/`, `Shared`, `Legal`, `Finance`, `Finance/Tax Returns`, `Finance/Receipts`, `Medical`, `Medical/Family`, `Medical/Mom`, `Medical/Dad`, `Kids`, `Kids/School`, `Kids/Activities`
- [x] 7.5 Seed at least 5 sample `Document` records (`status=ACTIVE`) spread across multiple folders using `DocumentFactory`
- [x] 7.6 Run `pnpm --filter @family-docs/db db:seed` and verify output / no errors

## 8. API Integration

- [x] 8.1 Add `"@family-docs/db": "workspace:*"` to `app/api/package.json` dependencies
- [x] 8.2 Run `pnpm install` from repo root to link the workspace package
- [x] 8.3 Verify `app/api` TypeScript build (`pnpm --filter @family-e-documents/api build` or `typecheck`) succeeds with db import
- [x] 8.4 Remove any direct `prisma` / `@prisma/client` dependency from `app/api/package.json` if present
