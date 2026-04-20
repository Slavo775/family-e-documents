## Context

The family-e-documents backend (NestJS + Prisma + PostgreSQL) already has
authentication and a document upload pipeline. Folders are the missing
organisational layer that documents will live in and that permissions cascade
from. The `Folder` model and `FolderPermission` model are referenced in the
Prisma schema but the module that owns them does not yet exist.

The spec (`openspec/specs/folders/spec.md`) defines the full API contract,
data model, and business rules. This document records the key technical
decisions made during implementation planning.

## Goals / Non-Goals

**Goals:**
- Implement `FoldersModule` in `app/api` covering all endpoints from the spec
- Add `Folder` Prisma migration and seed the root folder at bootstrap
- Publish `FolderNode` DTO and `FolderAction` enum to `packages/types`
- Integrate permission-filtered queries (VIEW check on every GET)
- Implement permission re-cascade on folder move

**Non-Goals:**
- Frontend folder browser UI
- Full permission resolution engine (FolderPermission CRUD belongs to a
  separate permissions module; folders only triggers cascade copy on create/move)
- Document move-between-folders
- Async S3 cleanup worker (cascade delete stubs the call; worker is separate)

## Decisions

### 1. Self-referential Prisma model with recursive CTE for tree queries

**Decision**: Use `Folder.parentId` (nullable FK to self) for the tree.
Recursive queries (descendants for cycle detection and cascade delete) use
raw `WITH RECURSIVE` CTEs via `prisma.$queryRaw`.

**Alternatives considered**:
- Nested sets / materialised path — more complex to maintain on moves; overkill
  for a small family app that will never have thousands of folders.
- Storing full path string — requires string updates on every rename/move.

**Rationale**: Simple self-referential FK is the natural Prisma pattern, well
understood, and sufficient at this scale. CTEs are used only for the two
operations that actually need full subtree traversal (cycle check + cascade delete).

---

### 2. Permission filtering via JOIN, not post-filter

**Decision**: `GET /api/v1/folders` resolves visibility by JOINing
`FolderPermission` inside the Prisma query rather than fetching all folders
and filtering in application code.

**Rationale**: Avoids leaking folder existence to unauthorised users and keeps
result sets correct at the DB level. ADMINs skip the JOIN entirely (guard
short-circuit).

---

### 3. Permission cascade on create/move is synchronous in the request

**Decision**: When a folder is created or moved, inherited `FolderPermission`
rows for the new parent are copied to the child folder synchronously within
the same transaction.

**Alternatives considered**:
- Background job — simpler code, but means the folder is briefly visible
  without correct permissions, which is unsafe.

**Rationale**: The permission cascade is O(users × folders-in-subtree). For a
family app this is trivially small. Keeping it synchronous simplifies the
transactional guarantee and avoids eventual-consistency edge cases.

---

### 4. Cascade delete stubs S3 cleanup

**Decision**: `DELETE ?strategy=cascade` deletes all DB rows (folders +
documents) in a transaction, then enqueues a list of S3 keys for async
deletion via a simple in-memory job queue stub. The stub logs the keys and is
replaced by the real S3 cleanup worker in a later change.

**Rationale**: Keeps folders self-contained without a hard dependency on a
worker infrastructure that doesn't exist yet.

---

### 5. Root folder seeded via Prisma seed script, not a migration

**Decision**: The root `/` folder is created in `prisma/seed.ts` with an
idempotent `upsert` keyed on `parentId IS NULL AND name = '/'`.

**Rationale**: Seed data is the conventional Prisma mechanism for bootstrap
fixtures. A migration-embedded INSERT would make the migration non-reversible.

## Risks / Trade-offs

- **Cycle detection cost** → A folder move must run a recursive CTE to verify
  the target is not a descendant. On a tiny family tree this is negligible.
  Mitigation: add a depth limit guard (max depth 20) to abort pathological cases.

- **Cascade delete is destructive and irreversible** → Protected by requiring
  ADMIN role and an explicit `?strategy=cascade` query param.
  Mitigation: audit log captures the delete with userId before rows are removed.

- **Inherited-permission rows grow with user count** → Every new user added to
  a parent folder duplicates rows to all descendants. At family scale (< 20
  users) this is fine.
  Mitigation: noted as a known limitation; a future change can switch to
  computed cascade if needed.
