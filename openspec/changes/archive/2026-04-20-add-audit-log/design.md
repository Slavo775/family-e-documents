## Context

The API currently has no durable record of HTTP requests. All user activity (uploads, downloads, permission changes, deletions) is invisible once the response is sent. Adding an audit log gives operators a queryable, persistent history without modifying any existing business logic.

The implementation is additive only: a new Prisma model, a new NestJS middleware, and a new admin-only module. No existing code paths change.

## Goals / Non-Goals

**Goals:**
- Record every HTTP request (authenticated and unauthenticated) to a Postgres table
- Never block or slow the response path — writes happen after `res.on('finish')`
- Redact sensitive fields from stored request bodies
- Expose a paginated, filterable read endpoint for ADMIN users
- Survive audit write failures without crashing the application

**Non-Goals:**
- Log retention / deletion (DB-level cron, out of scope)
- Frontend admin UI for browsing logs
- Real-time streaming or alerting on log events
- Log export (CSV, etc.)

## Decisions

### Middleware vs Interceptor

**Decision**: NestJS `NestMiddleware` over an `@Injectable()` interceptor.

**Why**: Middleware fires on every request uniformly, including routes that return early (e.g., 404s, auth guards that reject). Interceptors are tied to the controller layer and miss unauthenticated rejections from guards. Since the requirement is to log *all* requests, middleware is the correct hook.

**Alternative considered**: NestJS `Interceptor` — rejected because it doesn't fire when a guard short-circuits the pipeline.

---

### Write timing: `res.on('finish')` vs `res.on('close')`

**Decision**: `res.on('finish')` triggered async write, not blocking `next()`.

**Why**: `finish` fires after the response headers + body are flushed to the socket. `statusCode` and `durationMs` are both available at this point. The write must not block `next()` — if the DB is slow, the user's response must not wait.

**Trade-off**: If the process crashes between response flush and DB write, the log row is lost. This is acceptable for an observability feature — consistency with the DB is not a hard requirement.

---

### Body storage: mutating methods only

**Decision**: Store `req.body` only for `POST`, `PUT`, `PATCH`, `DELETE`. Store `null` for `GET`.

**Why**: GET bodies are semantically undefined (RFC 7231) and typically empty. Storing them adds column noise with no value. Mutating methods carry the interesting payload.

---

### Sanitisation: allowlist vs denylist

**Decision**: Denylist approach — redact known sensitive field names (`password`, `passwordHash`, `token`, `secret`).

**Why**: An allowlist would require updating the middleware every time a new safe field is added, creating friction. The denylist is a safety net and the domain is well-understood — these four fields cover all secrets in the current schema.

**Risk**: A future field named something else (e.g., `apiKey`) would not be redacted automatically. Mitigated by code review convention: any new secret-bearing field name must be added to `REDACTED_FIELDS`.

---

### Module structure

`AuditModule` in `app/api/src/audit/` containing:
- `audit.middleware.ts` — `AuditMiddleware` class
- `audit.service.ts` — `AuditService` wrapping Prisma calls (testable in isolation)
- `audit.controller.ts` — `GET /api/v1/audit-logs`
- `audit.dto.ts` — query param DTO + response DTO

`AuditMiddleware` is registered in `AppModule.configure()` for `{ path: '*', method: RequestMethod.ALL }`.

---

### Pagination

**Decision**: offset-based pagination (page + limit), not cursor-based.

**Why**: The admin query interface is low-traffic and the result set is ordered by `timestamp DESC`. Offset pagination is simpler to implement and filter. Cursor pagination adds complexity with no benefit at this traffic level.

**Constraint**: `limit` capped at 200 to prevent runaway queries.

## Risks / Trade-offs

- **Write failure silently drops log** → Mitigation: catch + `console.error` in the `finish` handler; never rethrow. Operators can monitor stderr.
- **High request volume saturates DB connection pool** → Mitigation: audit writes use the shared Prisma client; if the pool is saturated, writes are queued by Prisma. Acceptable for a low-traffic family app.
- **`req.user` not always populated at middleware time** → NestJS passport populates `req.user` before the route handler, so it is available at `finish` time. If auth guard rejects, `req.user` is undefined — logged as `userId: null`, which is correct.
- **`req.ip` behind a proxy** → If the app runs behind a reverse proxy, `req.ip` returns the proxy IP. Mitigation: ensure `app.set('trust proxy', 1)` in the NestJS bootstrap, or set `X-Forwarded-For` handling via Helmet.

## Migration Plan

1. Add `AuditLog` model to `schema.prisma`
2. Run `prisma migrate dev --name add-audit-log`
3. Deploy API — middleware auto-activates on startup
4. Verify rows appear in `audit_log` table after a few requests
5. **Rollback**: drop the `audit_log` table migration and remove the module registration from `AppModule`. No other code is affected.
