## ADDED Requirements

### Requirement: Package exists as a standalone pnpm workspace package
The system SHALL provide a `packages/db` directory that is a valid pnpm workspace package named `@family-docs/db`, independently installable and buildable within the monorepo.

#### Scenario: Package resolves as workspace dependency
- **WHEN** `app/api/package.json` declares `"@family-docs/db": "workspace:*"`
- **THEN** pnpm resolves the dependency to `packages/db` without installing from a registry

#### Scenario: Package builds independently
- **WHEN** `pnpm --filter @family-docs/db build` is run
- **THEN** TypeScript compiles without errors and `dist/` is produced

---

### Requirement: Prisma schema covers the full domain model
The `packages/db/prisma/schema.prisma` file SHALL define models for all domain entities specified in the project spec: `User`, `Folder`, `FolderPermission`, `Document`, and `AuditLog`.

#### Scenario: Schema matches domain entity fields
- **WHEN** `prisma validate` is run against the schema
- **THEN** it exits with code 0 and no validation errors

#### Scenario: User model contains required fields
- **WHEN** the schema is inspected
- **THEN** `User` has fields: `id` (cuid2), `email` (unique), `passwordHash`, `name`, `role` (enum: ADMIN | USER), `canRestrictDocs` (Boolean), `createdAt`, `updatedAt`

#### Scenario: Folder model supports self-referential tree
- **WHEN** the schema is inspected
- **THEN** `Folder` has a nullable `parentId` that references another `Folder`, and a `children` relation

#### Scenario: FolderPermission models per-user per-folder access grants
- **WHEN** the schema is inspected
- **THEN** `FolderPermission` has composite unique key on `(folderId, userId)`, an `actions` string array field, and an `inherited` Boolean

#### Scenario: Document model contains all required fields
- **WHEN** the schema is inspected
- **THEN** `Document` has: `id`, `name`, `title`, `description`, `tags` (String[]), `folderId`, `fileKey`, `mimeType`, `sizeBytes`, `status` (enum: PENDING | ACTIVE | DELETED), `visibility` (enum: PUBLIC | RESTRICTED), `allowedUserIds` (String[]), `uploadedById`, `createdAt`, `updatedAt`

#### Scenario: AuditLog model captures request telemetry
- **WHEN** the schema is inspected
- **THEN** `AuditLog` has: `id`, `userId` (nullable), `method`, `path`, `statusCode`, `durationMs`, `ipAddress`, `userAgent`, `body` (Json, nullable), `timestamp`

---

### Requirement: Prisma client is generated into src/generated/
The package SHALL configure Prisma to output the generated client to `src/generated/prisma/` so that generated types are stable and importable from TypeScript source.

#### Scenario: Generate script produces client files
- **WHEN** `pnpm --filter @family-docs/db db:generate` is run
- **THEN** `src/generated/prisma/client.js` and `src/generated/prisma/client.d.ts` exist

---

### Requirement: Database scripts exist for each lifecycle operation
The `packages/db/package.json` SHALL expose npm scripts covering the full Prisma database lifecycle.

#### Scenario: All required scripts are present
- **WHEN** `package.json` scripts are inspected
- **THEN** the following keys exist: `db:generate`, `db:push`, `db:migrate:dev`, `db:migrate:reset`, `db:migrate:deploy`, `db:studio`, `db:seed`

---

### Requirement: Environment-specific database URL via prisma.config.ts
The package SHALL provide a `prisma.config.ts` that reads `DATABASE_URL` from the environment, enabling dev / stage / prod to be differentiated solely by the value of that variable.

#### Scenario: Missing DATABASE_URL causes clear error
- **WHEN** `prisma migrate dev` is run without `DATABASE_URL` set
- **THEN** Prisma (or dotenv) throws an error referencing the missing variable

#### Scenario: Dev environment uses local Docker Postgres
- **WHEN** `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/family_docs` is set
- **THEN** `db:migrate:dev` connects to the local Postgres container defined in `docker-compose.yaml`

---

### Requirement: Public API exports PrismaClient and domain types
`packages/db/src/index.ts` SHALL re-export `PrismaClient`, `Prisma`, all model types, all enums, and the audit extension so that consumers need only import from `@family-docs/db`.

#### Scenario: Consumer can import PrismaClient without direct Prisma dependency
- **WHEN** `app/api` imports `import { PrismaClient } from '@family-docs/db'`
- **THEN** it compiles without error and without `prisma` in `app/api/package.json` dependencies

#### Scenario: All domain model types are importable
- **WHEN** `import type { User, Folder, Document, AuditLog, FolderPermission } from '@family-docs/db'`
- **THEN** TypeScript resolves all types without error

---

### Requirement: Audit Prisma extension is exported
The package SHALL export a `createAuditExtension` function that wraps Prisma's query extension API to log create, update, and delete operations on specified models.

#### Scenario: Extension logs a CREATE operation
- **WHEN** `createAuditExtension(['User'])` is applied to a PrismaClient and a user is created
- **THEN** an `AuditLog` record is inserted with `action = 'CREATE'` and `entity = 'User'`

#### Scenario: Sensitive fields are redacted in audit log
- **WHEN** a User record is created or updated with a `passwordHash` field
- **THEN** the audit log `changes` JSON stores `'[REDACTED]'` for `passwordHash`

---

### Requirement: Dev factories generate deterministic test entities
The package SHALL provide factory classes for each primary domain entity (`User`, `Folder`, `Document`) that produce valid, overridable in-memory objects for use in seed scripts and tests.

#### Scenario: Factory produces a valid default entity
- **WHEN** `new UserFactory()` is instantiated with no arguments
- **THEN** it produces a `User` object with all required fields populated and a unique email

#### Scenario: Factory accepts field overrides
- **WHEN** `new UserFactory({ email: 'admin@test.local' })` is called
- **THEN** the resulting user has `email = 'admin@test.local'` and all other fields defaulted

#### Scenario: Sequential factory calls produce unique entities
- **WHEN** `new UserFactory()` is called three times
- **THEN** each instance has a distinct `email` and `id`

---

### Requirement: Dev seed script populates realistic test data
`packages/db/src/seed.ts` SHALL be an idempotent script that creates a realistic development dataset including an admin user, a regular user, the canonical folder tree (as defined in PROJECT_SPEC.md), and sample documents.

#### Scenario: Seed is idempotent
- **WHEN** `db:seed` is run twice against the same database
- **THEN** no duplicate records are created (uses upsert)

#### Scenario: Admin user is seeded
- **WHEN** the seed completes
- **THEN** a user with `role = ADMIN` and `email = admin@family.local` exists

#### Scenario: Root folder tree is seeded
- **WHEN** the seed completes
- **THEN** the following folders exist: root `/`, `Shared`, `Legal`, `Finance`, `Finance/Tax Returns`, `Finance/Receipts`, `Medical`, `Medical/Family`, `Medical/Mom`, `Medical/Dad`, `Kids`, `Kids/School`, `Kids/Activities`

#### Scenario: Sample documents are seeded
- **WHEN** the seed completes
- **THEN** at least 5 `Document` records exist with `status = ACTIVE` spread across multiple folders

#### Scenario: Seed is guarded against production use
- **WHEN** `NODE_ENV=production db:seed` is executed
- **THEN** the script exits with a non-zero code and logs a warning
