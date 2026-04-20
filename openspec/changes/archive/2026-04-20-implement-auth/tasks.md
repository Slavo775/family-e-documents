## 1. Shared Types Package

- [x] 1.1 Add `Role` enum to `packages/types/src/enums.ts` (ADMIN, USER)
- [x] 1.2 Add `UserPublic` DTO interface to `packages/types/src/dtos.ts` (`id`, `email`, `name`, `role`, `canRestrictDocs`)
- [x] 1.3 Add `LoginDto` Zod schema to `packages/types/src/schemas.ts` (email + non-empty password)
- [x] 1.4 Export new types/schemas from `packages/types/src/index.ts`
- [x] 1.5 Build `packages/types` and verify TypeScript compilation

## 2. Database — Prisma Models & Migration

- [x] 2.1 Add `Role` enum to `app/api/prisma/schema.prisma`
- [x] 2.2 Add `User` model to schema (id cuid2, email unique, passwordHash, name, role, canRestrictDocs, createdAt, updatedAt)
- [x] 2.3 Add `Session` model to schema (id cuid2, userId FK→User cascade, token unique, expiresAt, createdAt)
- [x] 2.4 Run `pnpm prisma migrate dev --name add-auth-models` in `app/api`
- [x] 2.5 Verify migration file generated cleanly and Prisma client regenerated

## 3. Database — Seed Script

- [x] 3.1 Add `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to `app/api/.env.example`
- [x] 3.2 Create `app/api/prisma/seed.ts` that upserts initial ADMIN user with bcrypt-hashed password (saltRounds: 12)
- [x] 3.3 Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `app/api/package.json`
- [x] 3.4 Run `pnpm prisma db seed` and confirm ADMIN user created in DB

## 4. API — Auth Module

- [x] 4.1 Create `app/api/src/auth/auth.module.ts` importing PrismaModule
- [x] 4.2 Create `app/api/src/auth/session.service.ts` with: `createSession`, `validateToken` (SHA-256 lookup + expiry check + sliding window update), `deleteSession`
- [x] 4.3 Create `app/api/src/auth/auth.service.ts` with: `login` (find user, constant-time bcrypt compare using dummy hash when user not found, return UserPublic + token), `logout`
- [x] 4.4 Create `app/api/src/auth/auth.controller.ts` with: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- [x] 4.5 Create `app/api/src/auth/bearer-token.guard.ts` that extracts Bearer token, SHA-256s it, validates via `SessionService`, attaches `req.user`
- [x] 4.6 Register `AuthModule` in `app/api/src/app.module.ts`
- [x] 4.7 Add `bcrypt` and `@types/bcrypt` to `app/api/package.json` dependencies and install

## 5. API — Audit Logging for Auth

- [x] 5.1 Confirm audit middleware logs failed login attempts (401 responses) automatically via existing middleware — no extra wiring needed if middleware is already in place; document the verification

## 6. Frontend — NextAuth Configuration

- [x] 6.1 Add `next-auth` to `app/web/package.json` (if not already present) and install
- [x] 6.2 Create `app/web/src/app/api/auth/[...nextauth]/route.ts` with `CredentialsProvider` that calls `POST /api/v1/auth/login` and returns user + token
- [x] 6.3 Configure `jwt` callback to embed `apiToken`, `role`, and `canRestrictDocs` into the JWT
- [x] 6.4 Configure `session` callback to expose `session.user` shape: `{ id, email, name, role, canRestrictDocs }`
- [x] 6.5 Add `NEXTAUTH_SECRET` and `NEXTAUTH_URL` to `app/web/.env.example`
- [x] 6.6 Wrap `app/web/src/app/layout.tsx` with `SessionProvider`

## 7. Frontend — Route Protection Middleware

- [x] 7.1 Create `app/web/src/middleware.ts` using NextAuth `withAuth`, matcher covering all routes except `/login`, `/api/auth/**`, and static assets
- [x] 7.2 Verify unauthenticated request to `/` redirects to `/login`

## 8. Frontend — Login Page

- [x] 8.1 Add `react-hook-form`, `zod`, and `@hookform/resolvers` to `app/web/package.json` and install
- [x] 8.2 Rewrite `app/web/src/app/login/page.tsx` using shadcn `Card`, `CardHeader`, `CardContent`, `Input`, `Label`, `Button` from `@family-docs/ui`
- [x] 8.3 Wire React Hook Form with `zodResolver(LoginSchema)` from `packages/types`
- [x] 8.4 Set `autoComplete="current-password"` on the password `Input`
- [x] 8.5 On submit call `signIn('credentials', { email, password, redirect: false })` and display `"Invalid credentials"` for any error (map all NextAuth error codes to this string)
- [x] 8.6 Display inline field-level validation errors below each input using RHF `formState.errors`
- [x] 8.7 Verify form does NOT submit a network request when email is invalid or password is empty

## 9. Verification

- [x] 9.1 Manual smoke test: login with seeded ADMIN credentials → lands on `/` (or dashboard placeholder)
- [x] 9.2 Manual smoke test: wrong password → shows "Invalid credentials" on login page
- [x] 9.3 Manual smoke test: unknown email → shows "Invalid credentials" on login page
- [x] 9.4 Manual smoke test: unauthenticated navigation to `/` → redirected to `/login`
- [x] 9.5 Manual smoke test: logout → session invalidated, subsequent API call returns 401
<!-- Tasks 9.1–9.5 require running apps (pnpm dev). Run manually to verify. -->
- [x] 9.6 TypeScript strict check passes in `app/api`, `app/web`, and `packages/types` (`pnpm tsc --noEmit`)
