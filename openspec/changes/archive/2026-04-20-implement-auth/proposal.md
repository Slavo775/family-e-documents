## Why

Authentication is the entry gate for every capability in the app — no user can view, upload, or manage documents without a verified identity. The auth capability spec exists but has not been implemented; this change delivers the full working auth layer including login UI, NextAuth wiring, and the API endpoints that back it.

## What Changes

- Add `User` and `Session` Prisma models (schema already drafted in spec)
- Implement API endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Wire NextAuth.js credentials provider in the Next.js app, backed by the login API
- Implement the `/login` page with shadcn `Card`, `Input`, `Label`, and `Button` components
- Add React Hook Form + Zod client-side validation to the login form
- Add `middleware.ts` matcher to redirect unauthenticated users to `/login`
- Seed the first user as ADMIN via Prisma seed script
- Extend `packages/types` with `UserPublic` DTO, `Role` enum, and login Zod schema

## Capabilities

### New Capabilities

- None — `auth` spec already exists.

### Modified Capabilities

- `auth`: Adding explicit UI and validation requirements — shadcn component usage on the login page, React Hook Form + Zod form validation, generic error messaging to avoid credential enumeration, and `autoComplete="current-password"` on the password field.

## Non-goals

- OAuth / social login providers (deferred to a future change)
- Rate limiting or brute-force protection (out of scope per project spec)
- Self-service registration (ADMIN-only account creation only)
- Password reset / forgot-password flow

## Impact

- **app/web**: new `/login` page, `middleware.ts`, NextAuth config (`[...nextauth]/route.ts`)
- **app/api**: `AuthModule` with `AuthController`, `AuthService`, `SessionService`
- **packages/types**: `UserPublic`, `LoginDto`, `Role` enum (shared between web and api)
- **Prisma schema** (`app/api/prisma/schema.prisma`): `User`, `Session`, `Role` models/enum
- **Database**: new migration adding `users` and `sessions` tables
- **Dependencies**: `bcrypt` + `@types/bcrypt` in `app/api`; `next-auth`, `react-hook-form`, `zod`, `@hookform/resolvers` in `app/web`
