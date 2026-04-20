## Why

The API has no durable record of user actions, making it impossible to diagnose incidents, detect abuse, or satisfy future compliance requirements. The audit log middleware and queryable table provide this foundation from day one.

## What Changes

- Add `AuditLog` Prisma model to the database schema
- Implement `AuditMiddleware` in NestJS, applied globally, writing one row per request on `res.on('finish')`
- Implement `sanitizeBody` to redact sensitive fields (`password`, `passwordHash`, `token`, `secret`) before storage
- Add `GET /api/v1/audit-logs` endpoint restricted to ADMIN role with full filtering and pagination

## Capabilities

### New Capabilities

- `audit-log`: Request logging middleware + queryable audit log API. Covers the Prisma model, NestJS middleware, body sanitisation, and the admin read endpoint.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Non-goals

- Retention / deletion policy — handled at the DB level (cron job), out of app scope
- Alerting or streaming of log events
- Log export (CSV, JSON download)
- Frontend UI for viewing audit logs (ADMIN portal is out of scope for this change)

## Impact

- **Database**: new `audit_log` table; one migration required
- **API**: new `AuditModule` + `AuditController`; global middleware registered in `AppModule`
- **Prisma schema**: `AuditLog` model + relation back-reference on `User`
- **packages/types**: new `AuditLogEntry` DTO + query-param types
- **No breaking changes**
