# Auth Spec

## Overview
Email + password authentication via NextAuth.js (credentials provider).
Sessions are stored server-side (database adapter). No OAuth providers in v1.

---

## Data Model

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            Role      @default(USER)
  canRestrictDocs Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  sessions        Session[]
  documents       Document[]
  folderPerms     FolderPermission[]
  auditLogs       AuditLog[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Role {
  ADMIN
  USER
}
```

---

## API Contract

All auth endpoints live under `/api/v1/auth`.

### POST /api/v1/auth/login
```
Request:
  { email: string, password: string }

Response 200:
  { user: UserPublic, token: string, expiresAt: string }

Response 401:
  { message: "Invalid credentials" }
```

### POST /api/v1/auth/logout
```
Headers: Authorization: Bearer <token>

Response 204: (no body)
```

### GET /api/v1/auth/me
```
Headers: Authorization: Bearer <token>

Response 200:
  { id, email, name, role, canRestrictDocs }

Response 401:
  { message: "Unauthorized" }
```

---

## Business Rules

1. Passwords hashed with bcrypt (cost factor 12).
2. Only ADMIN can create new user accounts (no self-registration).
3. Session tokens are opaque random strings (32 bytes hex), stored hashed in DB.
4. Sessions expire after 30 days of inactivity (sliding window).
5. On logout all tokens for that session are invalidated.
6. Failed login attempts are logged to audit_log but NOT rate-limited (per project spec — no throttling).
7. The first user seeded in the DB is always ADMIN.

---

## Frontend integration (NextAuth)

- Provider: `CredentialsProvider` — calls `/api/v1/auth/login` internally.
- Session strategy: `jwt` (NextAuth JWT wrapping the API token).
- Session shape exposed to client:
  ```ts
  session.user = {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'USER'
    canRestrictDocs: boolean
  }
  ```
- Protected routes via NextAuth `middleware.ts` matcher.
- Redirect unauthenticated users to `/login`.

---

## Permission implications
- Auth is the entry gate for all other capabilities.
- Role from session is used as Layer 1 of the permission resolution chain (see permissions/spec.md).
