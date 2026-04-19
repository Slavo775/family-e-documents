# Tasks: Monorepo Scaffold

## Task 1 — Shared config packages ✓

Set up `packages/config-ts` and `packages/config-eslint`.

**Steps:**
- Create `packages/config-ts/` with `base.json`, `nextjs.json`, `nestjs.json`
- Create `packages/config-eslint/` with `base.js`, `nextjs.js`
- Add `package.json` for each with name `@family-docs/config-ts` / `@family-docs/config-eslint`

**Acceptance criteria:**
- Both packages can be referenced as workspace deps
- No TypeScript or lint errors in the packages themselves

---

## Task 2 — Shared types package ✓

Set up `packages/types` with initial enums.

**Steps:**
- Create `packages/types/src/enums.ts` exporting:
  - `Role` (ADMIN | USER)
  - `FolderAction` (VIEW | UPLOAD | DELETE | MANAGE)
  - `VisibilityMode` (PUBLIC | RESTRICTED)
  - `DocumentStatus` (PENDING | ACTIVE | DELETED)
- Create `packages/types/src/index.ts` re-exporting all
- Wire tsconfig extending `@family-docs/config-ts`

**Acceptance criteria:**
- `import { Role } from '@family-docs/types'` works from both `app/web` and `app/api`
- `pnpm typecheck` passes

---

## Task 3 — Shared UI package ✓

Set up `packages/ui` with shadcn init and a proof-of-concept component.

**Steps:**
- Init shadcn in `packages/ui`
- Set up Tailwind config with shared tokens (colours, fonts)
- Add `Button` component as the first shadcn component
- Export it from `packages/ui/src/index.ts`

**Acceptance criteria:**
- `import { Button } from '@family-docs/ui'` resolves without errors
- Tailwind class names compile correctly when package is consumed

---

## Task 4 — NestJS API scaffold ✓

Bootstrap `app/api` with NestJS, Prisma, and Swagger.

**Steps:**
- Scaffold NestJS app (`@nestjs/cli new`)
- Add Prisma (`prisma init`), configure `DATABASE_URL`, stub schema
- Add `PrismaModule` / `PrismaService` (global)
- Add `@nestjs/swagger` with Swagger UI at `/api/docs`
- Add `AuditMiddleware` stub (logs to console for now, wired globally)
- Add `helmet` and `ValidationPipe` globally
- Wire `tsconfig.json` to extend `@family-docs/config-ts/nestjs.json`
- Add `.env.example` with all required vars

**Acceptance criteria:**
- `pnpm --filter app/api dev` starts on port 3001
- `GET http://localhost:3001/api/docs` serves Swagger UI
- `prisma db push` succeeds against local Postgres
- `pnpm typecheck` passes

---

## Task 5 — Next.js web scaffold ✓

Bootstrap `app/web` with Next.js, Tailwind, shadcn, and NextAuth stub.

**Steps:**
- Scaffold Next.js app (`create-next-app --typescript --app --tailwind --eslint`)
- Install and configure shadcn (`npx shadcn-ui@latest init`)
- Add `@family-docs/ui` as workspace dep
- Add NextAuth.js: `auth.ts` with credentials provider stub (no DB yet)
- Add `middleware.ts` protecting all routes except `/login`
- Add stub `/login` page and `/dashboard` page
- Wire `tsconfig.json` to extend `@family-docs/config-ts/nextjs.json`

**Acceptance criteria:**
- `pnpm --filter app/web dev` starts on port 3000
- Visiting `http://localhost:3000` redirects unauthenticated users to `/login`
- shadcn `Button` renders on the login page stub
- `pnpm typecheck` passes

---

## Task 6 — Docker Compose + root scripts ✓

Wire up local infrastructure and root dev script.

**Steps:**
- Add `docker-compose.yaml` with postgres, minio, mailpit
- Add `.env.example` at root with all service URLs
- Add root `package.json` with `dev`, `lint`, `typecheck`, `format` scripts
- Install `concurrently` at root for `pnpm dev`
- Add `.gitignore` (node_modules, .env, dist, .next, build)
- Add `prettier.config.cjs` and `commitlint.config.cjs`

**Acceptance criteria:**
- `docker compose up -d` starts postgres on 5432, minio on 9000/9001, mailpit on 1025/8025
- `pnpm dev` from root starts both apps concurrently
- `pnpm lint` runs across all packages with no errors on the stub code
- `pnpm typecheck` runs across all packages and passes
