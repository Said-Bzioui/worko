# @worko/database

> WORKO Database SDK — Prisma client factory, PostgreSQL pool management, and type exports.

This package is the **single source of truth** for the WORKO database layer. It is consumed by `apps/backend_api`, `apps/worker`, and `tools/cli`. It is a **pure SDK**: it does not read environment variables at runtime — the consumer supplies the `DATABASE_URL` explicitly.

---

## Installation

> This package is published to [GitHub Packages](https://npm.pkg.github.com) under the `@worko` scope.

Authenticate with GitHub Packages once:

```bash
# .npmrc in your project
@worko:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
pnpm add @worko/database
# or
npm install @worko/database
```

---

## Usage

### Create a database client

```ts
import { createDatabaseClient } from '@worko/database';

const db = createDatabaseClient(process.env.DATABASE_URL!);

// Connect on startup
await db.connect();

// Use the Prisma client
const users = await db.prisma.user.findMany();

// Disconnect on shutdown
await db.disconnect();
```

### Create a bare PrismaClient

```ts
import { createPrismaClient } from '@worko/database';

const prisma = createPrismaClient(process.env.DATABASE_URL!);
await prisma.$connect();
// ... queries ...
await prisma.$disconnect();
```

### Import generated Prisma types

```ts
import type { User, Organization, Workspace, MembershipStatus } from '@worko/database';
```

---

## API

### `createDatabaseClient(databaseUrl: string, options?): DatabaseClient`

| Return Property | Type | Description |
|---|---|---|
| `prisma` | `PrismaClient` | The Prisma client instance (pg adapter) |
| `pool` | `Pool` | The underlying `pg` connection pool |
| `connect()` | `Promise<void>` | Calls `prisma.$connect()` |
| `disconnect()` | `Promise<void>` | Calls `prisma.$disconnect()` then `pool.end()` |

### `createPrismaClient(databaseUrl: string): PrismaClient`

Convenience wrapper. Returns the `PrismaClient` directly. Consumer is responsible for lifecycle.

---

## Schema

This package contains the full WORKO database schema (56 tables) under `prisma/schema/`. Migrations live in `prisma/migrations/`.

---

## Development

```bash
# Generate Prisma client from schema
pnpm prisma:generate

# Run migrations (dev)
pnpm prisma:migrate

# Seed development database
pnpm prisma:seed

# Run integration tests (requires DATABASE_URL in apps/backend_api/.env)
pnpm test

# Build the package
pnpm build
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.
