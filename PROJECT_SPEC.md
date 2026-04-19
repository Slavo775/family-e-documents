# Family E-Documents — Project Specification

## Vision

A private, self-hosted document management system for families. A secure space
where family members can upload, organise, and retrieve important documents —
passports, contracts, tax returns, medical records — with fine-grained control
over who can see what.

Think of it as a private Google Drive built for a family, not a company: simple
to use, opinionated about structure, and built with trust (not public access) as
the default.

---

## Monorepo Structure

```
family-e-documents/
├── app/
│   ├── web/          Next.js frontend
│   └── api/          NestJS backend
├── packages/
│   ├── ui/           shadcn component library (shared)
│   ├── types/        TypeScript types, enums, Zod schemas (shared)
│   ├── config-eslint/ shared ESLint config
│   └── config-ts/    shared TypeScript config bases
├── docker-compose.yaml
├── package.json      root scripts (dev, lint, typecheck, format)
└── pnpm-workspace.yaml
```

Package manager: **pnpm workspaces**

---

## Tech Stack

### Frontend — `app/web`

| Concern        | Choice                          |
|----------------|---------------------------------|
| Framework      | Next.js (App Router)            |
| Language       | TypeScript (strict)             |
| Styling        | Tailwind CSS                    |
| UI components  | shadcn/ui                       |
| Auth           | NextAuth.js (credentials)       |
| Server state   | TanStack Query                  |
| Forms          | React Hook Form + Zod           |
| Lint/format    | ESLint + Prettier               |

### Backend — `app/api`

| Concern        | Choice                          |
|----------------|---------------------------------|
| Framework      | NestJS                          |
| Language       | TypeScript (strict)             |
| Database       | PostgreSQL                      |
| ORM            | Prisma                          |
| File storage   | AWS S3 / MinIO (abstracted)     |
| Auth strategy  | JWT (issued by NextAuth)        |
| Validation     | class-validator + Zod           |
| Security       | helmet, CORS, input validation  |
| Throttling     | none (internal family app)      |
| API docs       | OpenAPI / Swagger               |
| Audit logging  | Prisma middleware → Postgres    |
| Lint/format    | ESLint + Prettier               |

### Local Infrastructure (Docker Compose)

| Service  | Purpose                    | Ports         |
|----------|----------------------------|---------------|
| Postgres | primary database           | 5432          |
| MinIO    | S3-compatible file storage | 9000 / 9001   |
| Mailpit  | SMTP catcher for dev email | 1025 / 8025   |

---

## Domain Model

### Entities

```
User
  id, email, passwordHash, name
  role: ADMIN | USER
  canRestrictDocs: boolean      ← admin-controlled toggle
  createdAt, updatedAt

Folder
  id, name
  parentId?                     ← self-referential tree
  createdById → User
  createdAt, updatedAt

FolderPermission
  folderId → Folder
  userId   → User
  actions: VIEW | UPLOAD | DELETE | MANAGE
  inherited: boolean            ← true = cascaded from parent folder

Document
  id, name, title, description
  tags: string[]
  folderId   → Folder
  fileKey                       ← S3 object key
  mimeType, sizeBytes
  status: PENDING | ACTIVE | DELETED
  visibility: PUBLIC | RESTRICTED
  allowedUserIds: string[]      ← populated only when RESTRICTED
  uploadedById → User
  createdAt, updatedAt

AuditLog
  id, userId?, method, path
  statusCode, durationMs
  ipAddress, userAgent
  body (sensitive fields redacted)
  timestamp
```

### Folder Tree

Documents live in a hierarchical folder tree. Folders can be nested arbitrarily.
Every document belongs to exactly one folder.

```
/ (root, seeded at bootstrap)
├── Shared/
├── Legal/
├── Finance/
│   ├── Tax Returns/
│   └── Receipts/
├── Medical/
│   ├── Family/
│   ├── Mom/       ← restricted to mom + admin
│   └── Dad/       ← restricted to dad + admin
└── Kids/
    ├── School/
    └── Activities/
```

---

## Permission System

Access is resolved through three ordered layers:

### Layer 1 — Role baseline

| Action        | ADMIN | USER (default) |
|---------------|-------|----------------|
| VIEW docs     | yes   | yes            |
| UPLOAD docs   | yes   | yes            |
| DELETE docs   | yes   | own only       |
| MANAGE folder | yes   | no             |
| Manage users  | yes   | no             |

ADMIN short-circuits all further checks.

### Layer 2 — Folder permissions

Per-user, per-folder grants or restrictions. Cascade from parent folder by
default; child folders can override.

- Creating a subfolder copies parent permissions to the child (`inherited = true`)
- Admin can write an explicit override (`inherited = false`) on any child
- Override does not propagate upward
- An empty `actions[]` on a user+folder effectively blocks that user

### Layer 3 — Document visibility

Applies only to VIEW operations on a specific document.

- `PUBLIC` → governed entirely by folder permission (Layer 2)
- `RESTRICTED` → additionally requires `userId ∈ document.allowedUserIds`

The document owner can set visibility to RESTRICTED only if `user.canRestrictDocs = true`
(controlled by admin per user). ADMIN can always set this field.

### Resolution order

```
1. ADMIN? → ALLOW
2. Folder permission (VIEW action)?  → DENY if absent
3. Document RESTRICTED? userId in allowlist? → DENY if not
4. → ALLOW
```

---

## Core Features

### Authentication
- Email + password login (no self-registration)
- ADMIN creates all accounts
- Session-based via NextAuth.js
- Protected routes via Next.js middleware

### Document Management
- Upload a document with: name, title, description, tags, folder
- Two-step upload: metadata POST → presigned S3 PUT → confirm POST
- List documents (paginated, folder-scoped)
- Download via S3 presigned GET URL
- Edit metadata (name, title, description, tags, visibility)
- Move document between folders
- Soft-delete (S3 cleanup async)

### Folder Management
- Create / rename / delete folders
- Nested tree (unlimited depth)
- Move folders (recalculates cascaded permissions)
- Breadcrumb path display

### Search
- Full-text search: title + description + tags (PostgreSQL `tsvector`)
- Fuzzy/partial match via `pg_trgm`
- Tag filter (combine with full-text)
- Scope to a specific folder subtree
- All results permission-filtered (only folders user can VIEW)
- Tag autocomplete endpoint

### User Management (ADMIN)
- Create / edit / delete users
- Assign role (ADMIN / USER)
- Toggle `canRestrictDocs` per user
- Assign folder permissions per user

### Audit Log (ADMIN)
- Every request logged: method, path, status, duration, IP, user agent
- Request body stored (sensitive fields redacted)
- Queryable via admin UI (filter by user, path, date range, status)

---

## File Storage

### Current: S3 / MinIO

Upload pattern: presigned URL (browser → S3 direct, file never touches API server).

```
1. Browser POST /documents (metadata) → API returns { documentId, uploadUrl }
2. Browser PUT uploadUrl → S3 (direct)
3. Browser POST /documents/:id/confirm → API verifies + activates
```

Object key format: `documents/{documentId}/{filename}`

### Future: NAS

The `StorageService` interface abstracts all S3 calls. Swapping to NAS means
implementing a new `NasStorageService` and rebinding it in `StorageModule`.
No business logic changes required.

---

## API Conventions

- Base path: `/api/v1/`
- All IDs: cuid2
- Dates: ISO 8601 UTC strings
- Pagination: `{ data, total, page, limit }`
- Auth header: `Authorization: Bearer <token>`
- Swagger UI: `/api/docs`
- All responses: `application/json`
- Validation errors: 400 with field-level messages

---

## Roles Reference

| Capability                        | ADMIN | USER (default) | USER (elevated) |
|-----------------------------------|-------|----------------|-----------------|
| Login                             | ✓     | ✓              | ✓               |
| View documents in permitted folders | ✓   | ✓              | ✓               |
| Upload documents                  | ✓     | ✓              | ✓               |
| Download documents                | ✓     | ✓              | ✓               |
| Delete own documents              | ✓     | ✓              | ✓               |
| Delete others' documents          | ✓     | ✗              | via folder perm |
| Restrict document visibility      | ✓     | ✗              | if canRestrictDocs=true |
| Create/rename/delete folders      | ✓     | ✗              | if MANAGE perm  |
| Search (permission-scoped)        | ✓     | ✓              | ✓               |
| View audit log                    | ✓     | ✗              | ✗               |
| Create/manage users               | ✓     | ✗              | ✗               |
| Assign folder permissions         | ✓     | ✗              | ✗               |
| Toggle canRestrictDocs for users  | ✓     | ✗              | ✗               |

---

## Development Roadmap

### Phase 1 — Foundation
1. `01-monorepo-scaffold` — repo structure, tooling, Docker Compose
2. `02-auth` — login/logout, NextAuth, protected routes, user seed
3. `03-user-management` — CRUD, role + canRestrictDocs, admin screens

### Phase 2 — Core Features
4. `04-folder-management` — tree CRUD, breadcrumbs, permission cascade UI
5. `05-document-upload` — presigned URL flow, metadata form, confirm step
6. `06-document-list` — paginated list, folder navigation, download
7. `07-document-visibility` — RESTRICTED mode, allowlist picker

### Phase 3 — Discovery
8. `08-search` — full-text + fuzzy + tag filter, permission-scoped results
9. `09-audit-log` — middleware, admin log viewer, filter UI

### Phase 4 — Polish
10. `10-permissions-ui` — admin screen for folder permission assignment
11. `11-storage-abstraction` — NAS StorageService implementation (future)

---

## Environment Variables

### `app/api/.env`
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/family_docs
S3_BUCKET=family-docs-bucket
S3_REGION=eu-central-1
S3_ENDPOINT=http://localhost:9000       # MinIO in dev
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
JWT_SECRET=changeme
UPLOAD_URL_TTL_SECONDS=900
DOWNLOAD_URL_TTL_SECONDS=3600
```

### `app/web/.env.local`
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
API_BASE_URL=http://localhost:3001
```

---

## Non-Goals (v1)

- No public sharing links (all access requires login)
- No file versioning (one file per document)
- No email notifications
- No mobile app
- No 2FA
- No real-time collaboration
- No rate limiting (internal family use)
- No AI tagging or classification
