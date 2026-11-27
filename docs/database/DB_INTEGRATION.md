# WORKO — NestJS Database Integration (`DB-03`)

## Architecture

`@said-bzioui/database` is the single owner of the Prisma 7 schema, migrations, and generated client. `apps/backend_api` consumes the typed `PrismaClient`, `PrismaPg`, and `Pool` exports from `@said-bzioui/database` through a dedicated global NestJS module.

```
packages/database/src/index.ts  ──►  @said-bzioui/database (PrismaClient + PrismaPg + Pool)
                                           │
                                           ▼
apps/backend_api/src/lib/prisma/
  ├── prisma.module.ts          (@Global() module exporting PrismaService)
  ├── prisma.service.ts         (OnModuleInit / OnModuleDestroy lifecycle)
  └── prisma.service.spec.ts    (NestJS lifecycle integration test)
```

## `PrismaService` Lifecycle

Implemented in [`apps/backend_api/src/lib/prisma/prisma.service.ts`](../../apps/backend_api/src/lib/prisma/prisma.service.ts):

- **Single Pool & Client:** Instantiates a single `pg.Pool` and `PrismaPg` adapter in the constructor.
- **`onModuleInit()`:** Calls `await this.$connect()` when NestJS initializes the module.
- **`onModuleDestroy()`:** Calls `await this.$disconnect()` and `await this.pool.end()` on application shutdown so no PostgreSQL sockets remain open.
- **Zero Business Logic:** `PrismaService` only manages database connectivity and exposes Prisma delegates.
- **Global Export:** `PrismaModule` is decorated with `@Global()` and imported in `AppModule`, making `PrismaService` injectable across all NestJS feature modules without duplicated `PrismaClient` instances.

## Verification & Test Results

- **`@said-bzioui/database` tests (`pnpm --filter @said-bzioui/database run test`):**
  - `integrity.test.ts`: **8/8 passed** (constraints, composite FKs, hierarchy cycles, custom field types, audit log append-only).
  - `seed-and-lifecycle.test.ts`: **4/4 passed** (seed idempotency, org/workspace/project/hierarchy retrieval, transaction rollback).
- **`backend_api` tests (`pnpm --filter worko run test`):**
  - Includes `prisma.service.spec.ts` verifying NestJS `onModuleInit`, live `$queryRaw` execution, and clean `app.close()` shutdown.
