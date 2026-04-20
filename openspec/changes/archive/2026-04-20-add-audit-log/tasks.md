## 1. Database

- [x] 1.1 Add `AuditLog` model to `schema.prisma` with all fields and indexes (`userId`, `timestamp`, `path`)
- [x] 1.2 Add `auditLogs` relation back-reference to the `User` model with `onDelete: SetNull`
- [x] 1.3 Run `prisma migrate dev --name add-audit-log` and verify migration file is generated
- [x] 1.4 Run `prisma generate` and confirm the `AuditLog` type is available in the Prisma client

## 2. Shared Types

- [x] 2.1 Add `AuditLogEntry` response DTO to `packages/types` (id, userId, userName, method, path, statusCode, durationMs, ipAddress, userAgent, body, timestamp)
- [x] 2.2 Add `AuditLogQueryParams` DTO to `packages/types` (userId, method, path, statusCode, from, to, page, limit)
- [x] 2.3 Add `AuditLogsResponse` type to `packages/types` (data, total, page, limit)

## 3. Middleware

- [x] 3.1 Create `app/api/src/audit/audit.middleware.ts` implementing `NestMiddleware`
- [x] 3.2 Implement `sanitizeBody` function with `REDACTED_FIELDS = ['password', 'passwordHash', 'token', 'secret']`
- [x] 3.3 Store body only for `POST`, `PUT`, `PATCH`, `DELETE`; set `null` for `GET`
- [x] 3.4 Write the log row inside `res.on('finish')` callback (not blocking `next()`)
- [x] 3.5 Wrap Prisma write in try/catch; log errors to `console.error` and never rethrow

## 4. Service & Controller

- [x] 4.1 Create `app/api/src/audit/audit.service.ts` with `findAll(query: AuditLogQueryParams)` method
- [x] 4.2 Implement Prisma query in `findAll`: filters for userId, method, path (startsWith), statusCode, from/to date range; order by `timestamp DESC`; offset pagination with limit capped at 200
- [x] 4.3 Create `app/api/src/audit/audit.controller.ts` with `GET /api/v1/audit-logs` route
- [x] 4.4 Apply `@Roles(Role.ADMIN)` guard and `@UseGuards(BearerTokenGuard, RolesGuard)` on the controller
- [x] 4.5 Wire up query param validation with `class-validator` / `ValidationPipe`
- [x] 4.6 Return `AuditLogsResponse` shape: `{ data, total, page, limit }`

## 5. Module Registration

- [x] 5.1 Create `app/api/src/audit/audit.module.ts` exporting `AuditService` and declaring `AuditController`
- [x] 5.2 Import `AuditModule` in `AppModule`
- [x] 5.3 Register `AuditMiddleware` in `AppModule.configure()` for `{ path: '*', method: RequestMethod.ALL }`
- [x] 5.4 Ensure `trust proxy` is set in NestJS bootstrap so `req.ip` returns the real client IP behind a reverse proxy

## 6. Verification

- [x] 6.1 Make a test request and confirm a row appears in `audit_log` with correct fields
- [x] 6.2 Make a `POST /api/v1/auth/login` request and confirm `password` is stored as `[REDACTED]`
- [x] 6.3 Call `GET /api/v1/audit-logs` as ADMIN and confirm paginated response returns correctly
- [x] 6.4 Call `GET /api/v1/audit-logs` as a USER and confirm HTTP 403 is returned
- [x] 6.5 Call `GET /api/v1/audit-logs` unauthenticated and confirm HTTP 401 is returned
- [x] 6.6 Test `limit=500` query param and confirm response caps at 200
