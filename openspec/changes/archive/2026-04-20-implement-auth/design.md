## Context

Auth is the first capability to be implemented — nothing else works without a verified identity. The data model is already drafted in the spec. This change spans two packages (`packages/types` for shared DTOs/enums), the NestJS API (`app/api`), and the Next.js frontend (`app/web`). NextAuth.js is already listed as a dependency in the web app but is not yet wired up.

The API uses a custom session token approach rather than purely relying on NextAuth's built-in database adapter, because the API must be independently callable (not just from the web client).

## Goals / Non-Goals

**Goals:**
- Working end-to-end login/logout flow using email + password
- Server-side session storage with 30-day sliding expiry
- NextAuth credentials provider wrapping the custom API token
- Secure login page (shadcn UI, client-side Zod validation, generic errors)
- First-user ADMIN seeding
- Audit logging of failed login attempts

**Non-Goals:**
- OAuth / social providers
- Rate limiting or account lockout
- Self-service registration
- Password reset

## Decisions

### 1. Custom API session tokens + NextAuth JWT wrapping them

**Decision**: The API issues opaque 32-byte hex session tokens stored hashed in the `sessions` table. NextAuth wraps this API token in its own JWT cookie (`strategy: "jwt"`).

**Why**: The API must be independently callable (e.g., from future mobile clients or CLI tools). A pure NextAuth-only session would bind the frontend and backend too tightly. The JWT wrapping is thin — it holds `{ id, email, role, canRestrictDocs, apiToken }` — so the web app can call the API by forwarding `apiToken` as the `Authorization: Bearer` header.

**Alternative considered**: NextAuth database adapter managing sessions directly — rejected because it would require the frontend to own the Prisma connection, conflating concerns.

---

### 2. Session token stored hashed in DB

**Decision**: The raw token is returned to the client once. The DB stores `SHA-256(token)`. Lookup is by `SHA-256(incoming token)`.

**Why**: If the `sessions` table is dumped, tokens cannot be replayed without knowing the raw values. Bcrypt is not used here (unlike passwords) because session tokens are long random strings — SHA-256 is sufficient and fast for lookup.

---

### 3. Bcrypt cost factor 12 for passwords

**Decision**: Use `bcrypt` with `saltRounds: 12` for password hashing.

**Why**: Factor 12 is the current OWASP recommendation balancing security and server response time (~250 ms on commodity hardware). argon2id would be stronger but adds a native dependency that complicates the Docker build; bcrypt is already well-understood in the ecosystem.

---

### 4. Generic "Invalid credentials" error for all login failures

**Decision**: The login endpoint returns HTTP 401 with `{ message: "Invalid credentials" }` whether the email is not found or the password is wrong. This is enforced at the API level; the frontend also maps any NextAuth error to this string.

**Why**: Distinct error messages ("user not found" vs "wrong password") allow attackers to enumerate valid email addresses. Constant-time response parity (perform bcrypt compare even when user is not found, using a dummy hash) prevents timing-based enumeration.

---

### 5. Sliding session expiry (30 days), reset on each authenticated request

**Decision**: Each successful API call that validates a session token updates `Session.expiresAt` to `now() + 30 days`.

**Why**: Active users stay logged in indefinitely; inactive sessions expire naturally. Full session revocation on logout clears all tokens for that user session.

---

### 6. NestJS `AuthGuard` for route protection on the API

**Decision**: Implement a custom `BearerTokenGuard` in NestJS that extracts the `Authorization: Bearer` token, SHA-256s it, looks it up in the `sessions` table (checking expiry), and attaches `req.user` for downstream handlers.

**Why**: Keeps auth logic in one place; other modules declare `@UseGuards(BearerTokenGuard)` without reimplementing token lookup.

---

### 7. NextAuth `middleware.ts` for route protection on the frontend

**Decision**: Use NextAuth's `withAuth` middleware with a matcher covering all routes except `/login` and `/api`.

**Why**: App Router's middleware runs at the edge before any page renders — unauthenticated users are redirected before any data is fetched.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| bcrypt timing side-channel on "user not found" branch | Always run `bcrypt.compare` against a static dummy hash when no user is found, so timing is indistinguishable from a real compare. |
| `sessions` table unbounded growth | A background cron to prune `expiresAt < now()` rows is a future follow-up; acceptable for v1 given small user base. |
| NextAuth JWT holds `apiToken` in the client cookie | The JWT is signed (HS256) and the raw session token in the cookie is the encrypted JWT — not plaintext. Acceptable for the trust model of this app. |
| First-run ADMIN seeding could be re-run | Seed script is idempotent: it upserts by email. Running it twice does not create duplicate admins. |

## Migration Plan

1. Run `prisma migrate dev --name add-auth-models` to create `users` and `sessions` tables.
2. Run `prisma db seed` to create the initial ADMIN account (credentials from `.env`).
3. Deploy `app/api` with the new `AuthModule`.
4. Deploy `app/web` with NextAuth config and updated login page.
5. **Rollback**: Drop the migration (`prisma migrate resolve --rolled-back`), redeploy previous API build. No data loss beyond the new tables.

## Open Questions

- Should `Session` track `deviceName` / `userAgent` for a "logged-in devices" view? (Deferred — not in v1 scope.)
- Initial ADMIN credentials: hardcode in `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) or prompt interactively? Decision: `.env` variables for CI compatibility.
