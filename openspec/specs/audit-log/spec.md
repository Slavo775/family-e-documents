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
