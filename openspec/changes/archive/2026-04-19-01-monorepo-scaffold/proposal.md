# Proposal: Monorepo Scaffold

## Summary
Bootstrap the full monorepo structure with working dev environments for both
`app/web` (Next.js) and `app/api` (NestJS), shared packages, tooling, and
Docker Compose for local infrastructure.

## Goals
- `app/web` running with Next.js App Router, Tailwind, shadcn, NextAuth wired up
- `app/api` running with NestJS, Prisma connected to Postgres, Swagger enabled
- `packages/ui`, `packages/types`, `packages/config-eslint`, `packages/config-ts` in place
- Docker Compose providing Postgres, MinIO (S3), and a mail catcher
- ESLint + Prettier + TypeScript strict configured across all packages
- `pnpm dev` starts both apps concurrently

## Non-goals
- No business logic (documents, folders, search) in this change
- No authentication implementation (that is change 02)
- No deployment configuration
- No tests (testing setup comes later per capability)

## Approach
1. Scaffold `packages/config-ts` and `packages/config-eslint` first — everything depends on them.
2. Scaffold `packages/types` with the initial enums (Role, FolderAction, VisibilityMode, DocumentStatus).
3. Scaffold `packages/ui` with shadcn init and a Button component as proof of concept.
4. Scaffold `app/api` with NestJS CLI, wire Prisma + Postgres, add Swagger.
5. Scaffold `app/web` with Next.js create-app, add Tailwind + shadcn + NextAuth stub.
6. Add Docker Compose with Postgres + MinIO + mail catcher.
7. Add root `pnpm dev` script using `concurrently`.

## Out of scope
- CI/CD pipeline
- Production Docker image
- Seed data
