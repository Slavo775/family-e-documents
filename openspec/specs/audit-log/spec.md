# Audit Log Spec

## Overview
Every HTTP request to the NestJS API is recorded by a middleware layer.
Logs are structured JSON written to a Postgres `audit_log` table via Prisma.
This gives a queryable, durable history of all user actions.

---

## Data Model

```prisma
model AuditLog {
  id          String    @id @default(cuid())
  userId      String?   // null for unauthenticated requests
  method      String    // GET, POST, PATCH, DELETE, PUT
  path        String    // e.g. /api/v1/documents/cm3abc
  statusCode  Int
  durationMs  Int
  ipAddress   String
  userAgent   String?
  body        Json?     // request body (sensitive fields redacted)
  timestamp   DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([timestamp])
  @@index([path])
}
```

---

## Middleware Implementation

NestJS middleware (`AuditMiddleware`) applied globally in `AppModule`:

```ts
// Runs on every request
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()

    res.on('finish', async () => {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id ?? null,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] ?? null,
          body: sanitizeBody(req.body),
        }
      })
    })

    next()
  }
}
```

---

## Body Sanitisation

The `sanitizeBody` function removes sensitive fields before storing:

```ts
const REDACTED_FIELDS = ['password', 'passwordHash', 'token', 'secret']

function sanitizeBody(body: unknown): object | null {
  if (!body || typeof body !== 'object') return null
  const sanitized = { ...body as Record<string, unknown> }
  for (const field of REDACTED_FIELDS) {
    if (field in sanitized) sanitized[field] = '[REDACTED]'
  }
  return sanitized
}
```

---

## API Contract (ADMIN only)

### GET /api/v1/audit-logs
```
Query params:
  userId?: string
  method?: string         // GET | POST | PATCH | DELETE | PUT
  path?: string           // prefix match
  statusCode?: number
  from?: string           // ISO 8601 date
  to?: string             // ISO 8601 date
  page?: number           // default 1
  limit?: number          // default 50, max 200

Response 200:
  {
    data: AuditLogEntry[]
    total: number
    page: number
    limit: number
  }

type AuditLogEntry = {
  id: string
  userId: string | null
  userName: string | null
  method: string
  path: string
  statusCode: number
  durationMs: number
  ipAddress: string
  userAgent: string | null
  body: object | null
  timestamp: string
}
```

---

## Business Rules

1. All requests are logged — authenticated and unauthenticated.
2. The middleware fires on `res.on('finish')` — logs are written async after
   the response is sent and do NOT block the request.
3. Audit log writes that fail are caught and logged to stderr (never crash the app).
4. Body is stored only for mutating requests (POST, PUT, PATCH, DELETE).
   GET request bodies are stored as null.
5. `password`, `passwordHash`, `token`, `secret` are always redacted.
6. Only ADMIN can query audit logs via the API.
7. Audit log rows are never deleted by the application.
   Retention policy (e.g. 1 year) is a DB-level cron job, out of app scope.
8. `userId` is set to null (not CASCADE deleted) when a user is deleted,
   preserving the historical record.

---

## Requirements

### Requirement: All HTTP requests are logged to the audit table
The system SHALL record every inbound HTTP request (authenticated and unauthenticated) to the `audit_log` Postgres table. A log row MUST be written for every request regardless of status code, route, or authentication state.

#### Scenario: Authenticated request is logged with userId
- **WHEN** an authenticated user makes any HTTP request
- **THEN** a row is inserted into `audit_log` with `userId` set to the authenticated user's ID, and `method`, `path`, `statusCode`, `durationMs`, `ipAddress`, `userAgent`, and `timestamp` populated

#### Scenario: Unauthenticated request is logged with null userId
- **WHEN** a request is made without valid authentication
- **THEN** a row is inserted into `audit_log` with `userId` set to `null` and all other fields populated

#### Scenario: Log write does not block the response
- **WHEN** the audit log write to Postgres is slow or temporarily unavailable
- **THEN** the HTTP response is already sent to the client before the write is attempted, and the client experiences no additional latency

#### Scenario: Audit write failure does not crash the application
- **WHEN** the Prisma write to `audit_log` throws an exception
- **THEN** the error is caught and written to stderr, and the application continues handling subsequent requests without interruption

---

### Requirement: Request bodies are stored for mutating methods only
The system SHALL store the request body in the `body` column only for `POST`, `PUT`, `PATCH`, and `DELETE` requests. The `body` column MUST be `null` for `GET` requests.

#### Scenario: POST body is stored
- **WHEN** a `POST` request is made with a JSON body
- **THEN** the `body` column of the resulting audit log row contains the sanitised request body

#### Scenario: GET body is null
- **WHEN** a `GET` request is made
- **THEN** the `body` column of the resulting audit log row is `null`

---

### Requirement: Sensitive fields are redacted from stored bodies
Before storing the request body, the system SHALL replace the values of fields named `password`, `passwordHash`, `token`, or `secret` with the literal string `[REDACTED]`. All other fields SHALL be stored as-is.

#### Scenario: Password field is redacted
- **WHEN** a `POST /api/v1/auth/login` request includes `{ "email": "a@b.com", "password": "secret123" }`
- **THEN** the stored `body` is `{ "email": "a@b.com", "password": "[REDACTED]" }`

#### Scenario: Non-sensitive fields pass through unchanged
- **WHEN** a `POST` request body contains `{ "name": "My Document", "folderId": "cm3abc" }`
- **THEN** the stored `body` contains both fields with their original values

---

### Requirement: ADMIN can query audit logs via paginated API
The system SHALL expose `GET /api/v1/audit-logs` accessible only to users with the `ADMIN` role. The endpoint MUST return a paginated list of audit log entries ordered by `timestamp` descending and support filtering by `userId`, `method`, `path` (prefix match), `statusCode`, `from`, and `to`.

#### Scenario: Admin retrieves first page of logs
- **WHEN** an ADMIN sends `GET /api/v1/audit-logs`
- **THEN** the response is HTTP 200 with `{ data: AuditLogEntry[], total: number, page: 1, limit: 50 }`

#### Scenario: Admin filters by userId
- **WHEN** an ADMIN sends `GET /api/v1/audit-logs?userId=<id>`
- **THEN** only rows with `userId = <id>` are returned

#### Scenario: Admin filters by date range
- **WHEN** an ADMIN sends `GET /api/v1/audit-logs?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z`
- **THEN** only rows with `timestamp >= from` and `timestamp <= to` are returned

#### Scenario: Admin filters by path prefix
- **WHEN** an ADMIN sends `GET /api/v1/audit-logs?path=/api/v1/documents`
- **THEN** only rows where `path` starts with `/api/v1/documents` are returned

#### Scenario: Limit is capped at 200
- **WHEN** an ADMIN sends `GET /api/v1/audit-logs?limit=500`
- **THEN** the response returns at most 200 rows and `limit` in the response body is `200`

#### Scenario: Non-admin is denied access
- **WHEN** a USER (non-admin) sends `GET /api/v1/audit-logs`
- **THEN** the response is HTTP 403 Forbidden

#### Scenario: Unauthenticated request is denied
- **WHEN** an unauthenticated client sends `GET /api/v1/audit-logs`
- **THEN** the response is HTTP 401 Unauthorized

---

### Requirement: Audit log rows are immutable
The system SHALL NOT provide any API endpoint or application-level mechanism to update or delete audit log rows. The `audit_log` table is append-only from the application's perspective.

#### Scenario: No delete endpoint exists
- **WHEN** any client sends `DELETE /api/v1/audit-logs/<id>`
- **THEN** the response is HTTP 404 Not Found (route does not exist)

---

### Requirement: User deletion preserves audit log history
When a `User` row is deleted, all associated `AuditLog` rows SHALL have their `userId` set to `null` (SET NULL on delete), preserving the historical record of requests made by that user.

#### Scenario: User deletion nullifies userId in audit logs
- **WHEN** an ADMIN deletes a user who has existing audit log entries
- **THEN** those audit log rows remain in the table with `userId = null`
- **THEN** no audit log rows are deleted as a result of the user deletion
