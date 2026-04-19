# Design: Monorepo Scaffold

## Repo Layout

```
family-e-documents/
├── app/
│   ├── web/                     Next.js (App Router)
│   │   ├── src/
│   │   │   ├── app/             routes
│   │   │   ├── components/      page-level components
│   │   │   └── lib/             auth.ts, api-client.ts
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json        extends packages/config-ts/nextjs.json
│   │   └── package.json
│   └── api/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── prisma/          PrismaModule, PrismaService
│       │   └── common/          audit middleware stub (empty handler for now)
│       ├── prisma/
│       │   └── schema.prisma    empty schema (models added per change)
│       ├── tsconfig.json        extends packages/config-ts/nestjs.json
│       └── package.json
├── packages/
│   ├── config-eslint/
│   │   ├── base.js              shared ESLint base rules
│   │   ├── nextjs.js            extends base + next/core-web-vitals
│   │   └── package.json
│   ├── config-ts/
│   │   ├── base.json            strict TS base
│   │   ├── nextjs.json          extends base + Next.js paths
│   │   ├── nestjs.json          extends base + NestJS decorators
│   │   └── package.json
│   ├── types/
│   │   ├── src/
│   │   │   ├── enums.ts         Role, FolderAction, VisibilityMode, DocumentStatus
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   ├── components/      shadcn components live here
│       │   └── index.ts         re-exports all components
│       ├── tailwind.config.ts   shared Tailwind config/tokens
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yaml
├── .env.example
├── .gitignore
├── .prettierrc.cjs
├── commitlint.config.cjs
├── package.json                 root (scripts: dev, lint, typecheck)
└── pnpm-workspace.yaml
```

## Package Names (for cross-package imports)

```
@family-docs/ui
@family-docs/types
@family-docs/config-eslint
@family-docs/config-ts
```

## Docker Compose Services

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: family_docs
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"    # MinIO console

  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"    # SMTP
      - "8025:8025"    # Web UI
```

## TypeScript Config Strategy

```
packages/config-ts/base.json
  strict: true
  target: ES2022
  moduleResolution: bundler

packages/config-ts/nextjs.json
  extends: ./base.json
  + jsx: preserve
  + paths: { "@/*": ["./src/*"] }

packages/config-ts/nestjs.json
  extends: ./base.json
  + experimentalDecorators: true
  + emitDecoratorMetadata: true
```

## ESLint Config Strategy

```
packages/config-eslint/base.js
  + @typescript-eslint/recommended
  + prettier (last, disables formatting rules)

packages/config-eslint/nextjs.js
  extends base + next/core-web-vitals

// each app's eslint.config.mjs:
import { nextjsConfig } from '@family-docs/config-eslint'
export default nextjsConfig
```

## Root Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter app/web dev\" \"pnpm --filter app/api dev\"",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write ."
  }
}
```

## Initial Prisma Schema (stub)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models added per capability change
```
