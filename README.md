# Worko

**Worko** is a modern, scalable full-stack platform built with a TypeScript monorepo architecture.

The project uses **NestJS, React, Prisma, PostgreSQL, Redis, BullMQ, and Better Auth**, with shared workspace packages, independent applications, and centralized Docker & CI infrastructure.

## Tech Stack

| Category | Technology |
| --- | --- |
| Monorepo | pnpm Workspaces, Turborepo |
| Backend | NestJS 12, TypeScript 6 |
| Frontend | React 19, Vite 8, TypeScript 6 |
| Database | PostgreSQL 17, Prisma ORM 7 |
| Authentication | Better Auth |
| Queue System | Redis 7, BullMQ |
| API Documentation | Swagger / OpenAPI |
| Security | Arcjet |
| Observability | NestJS Observe |
| Styling | Tailwind CSS 4, shadcn/ui |
| Testing | Vitest |
| Code Quality | Oxlint, ESLint, Prettier |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx |
| CI/CD | GitHub Actions |

## Architecture

Worko follows a monorepo architecture where applications and shared packages are maintained in a single repository.

```text
worko/
├── apps/
│   ├── backend_api/       # NestJS REST API ("worko")
│   ├── frontend_ui/       # React + Vite frontend ("frontend")
│   └── worker/            # BullMQ background job processor ("@workflow-pro/worker")
├── packages/
│   ├── database/          # Centralized Prisma 7 infrastructure ("@workflow-pro/database")
│   └── auth-sdk/          # Better Auth client SDK ("@workflow-pro/auth-sdk")
├── infrastructure/
│   └── docker/
│       ├── docker-compose.yml
│       ├── Dockerfile.api
│       ├── Dockerfile.worker
│       ├── Dockerfile.frontend
│       └── nginx.conf
├── docs/
│   ├── architecture/
│   └── adr/
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

## Applications

### 1. Backend API (`apps/backend_api` — `worko`)

A REST API built with NestJS 12 and TypeScript 6.

- NestJS modular architecture with URI versioning (`/api/v1`).
- Better Auth authentication mounted at `/api/auth/*`.
- PostgreSQL integration through `@workflow-pro/database` (`PrismaService` + `@prisma/adapter-pg`).
- Background job enqueueing via `@nestjs/bullmq` (`QueueService`).
- Arcjet security and rate limiting.
- NestJS Observe instrumentation and Swagger / OpenAPI documentation.

| Endpoint | Description |
| --- | --- |
| `/api/v1/health` | API health check |
| `/api/auth/*` | Better Auth endpoints |
| `/docs` | Swagger documentation |

### 2. Frontend UI (`apps/frontend_ui` — `frontend`)

A client application built with React 19, Vite 8, and TypeScript.

- Tailwind CSS v4 and `shadcn/ui` components with dark/light theme support.
- Client-side routing with `react-router-dom` v7.
- Typed API client (`src/lib/api-client.ts`) and Vite `/api` dev proxy.
- Shared authentication via `@workflow-pro/auth-sdk` (`src/lib/auth-client.ts`).

### 3. Background Worker (`apps/worker` — `@workflow-pro/worker`)

An independent Node.js process responsible for asynchronous background jobs.

- BullMQ `Worker` listening on the `worko-jobs` queue via Redis.
- Shared PostgreSQL access through `@workflow-pro/database` (`createPrismaClient()`).
- Graceful `SIGINT`/`SIGTERM` shutdown.

## Shared Packages

| Package | Path | Responsibility |
| --- | --- | --- |
| `@workflow-pro/database` | `packages/database` | Centralized Prisma 7 schema, migrations, generated client, and `pg` adapter |
| `@workflow-pro/auth-sdk` | `packages/auth-sdk` | Type-safe Better Auth client (`emailAndPassword`, `github`/`google` social, sessions) |

> Planned future packages (`api-sdk`, `shared-types`, `shared-utils`, `config-*`) will be added under `packages/` as needed.

## Infrastructure

### PostgreSQL & Prisma 7

PostgreSQL 17 is the primary relational database, managed centrally in `packages/database` (`prisma/schema.prisma`, `prisma/migrations/`, `prisma.config.ts`).

### Redis & BullMQ

Redis 7 powers asynchronous job queues between the API and Worker:

```text
Frontend ──▶ Backend API ──▶ BullMQ Queue (Redis) ──▶ Worker ──▶ PostgreSQL
```

### Docker

Docker Compose (`infrastructure/docker/docker-compose.yml`) provides local PostgreSQL 17 and Redis 7 services. Production multi-stage Dockerfiles (`Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.frontend` + `nginx.conf`) are also included.

## Prerequisites

- **Node.js** 22+
- **pnpm** 12.x
- **Docker Desktop** (for local PostgreSQL & Redis)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Said-Bzioui/worko.git
cd worko
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the `.env.example` files in the root, `apps/frontend_ui`, and `apps/worker` (and configure `apps/backend_api/.env`). Never commit `.env` files or secrets.

### 4. Start infrastructure

```bash
pnpm docker:up
```

### 5. Build shared packages & generate Prisma Client

```bash
pnpm --filter @workflow-pro/database build
pnpm --filter @workflow-pro/auth-sdk build
```

### 6. Run database migrations

```bash
pnpm --filter @workflow-pro/database prisma:migrate
```

### 7. Start development

```bash
pnpm dev        # Runs persistent dev tasks (frontend, worker)
pnpm dev:api    # Starts Backend API in watch mode
```

## Available Scripts

### Monorepo (Root)

| Command | Description |
| --- | --- |
| `pnpm install` | Install workspace dependencies |
| `pnpm build` | Build workspace packages via Turborepo |
| `pnpm dev` | Run persistent `dev` tasks via Turborepo |
| `pnpm dev:api` | Start `apps/backend_api` in watch mode |
| `pnpm lint` | Run linters across workspace packages |
| `pnpm typecheck` | Run TypeScript checks across workspace packages |
| `pnpm test` | Run tests across workspace packages |
| `pnpm clean` | Clean build outputs |

### Database (`@workflow-pro/database`)

| Command | Description |
| --- | --- |
| `pnpm --filter @workflow-pro/database prisma:generate` | Generate Prisma Client |
| `pnpm --filter @workflow-pro/database prisma:migrate` | Create and apply development migrations |
| `pnpm --filter @workflow-pro/database prisma:deploy` | Apply production migrations |
| `pnpm --filter @workflow-pro/database prisma:push` | Push schema changes |
| `pnpm --filter @workflow-pro/database prisma:studio` | Open Prisma Studio |

### Docker

| Command | Description |
| --- | --- |
| `pnpm docker:up` | Start PostgreSQL and Redis |
| `pnpm docker:down` | Stop infrastructure services |

### Individual Apps

```bash
pnpm --filter worko start:dev              # Backend API
pnpm --filter frontend dev                 # Frontend UI
pnpm --filter @workflow-pro/worker dev     # Background Worker
```

## API Documentation

Once `apps/backend_api` is running:

- **API Base URL:** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/docs`
- **Health Check:** `http://localhost:3000/api/v1/health`
- **Authentication:** `http://localhost:3000/api/auth`

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`:

1. `pnpm install --frozen-lockfile`
2. Build shared packages (`@workflow-pro/database`, `@workflow-pro/auth-sdk`)
3. Typecheck (`@workflow-pro/worker`, `frontend`)
4. Lint (`worko`, `frontend`)
5. Build apps (`worko`, `@workflow-pro/worker`, `frontend`)
6. Test (`worko`)

## Project Status

| Component | Status |
| --- | --- |
| Monorepo Setup (`pnpm` + `turbo`) | Implemented |
| Backend API (`apps/backend_api`) | Implemented |
| Frontend UI (`apps/frontend_ui`) | Implemented |
| Authentication SDK (`packages/auth-sdk`) | Implemented |
| Database Package (`packages/database`) | Implemented |
| Background Worker (`apps/worker`) | Implemented |
| Redis & BullMQ | Implemented |
| Docker Infrastructure | Configured |
| GitHub Actions CI | Configured |
| Integration & E2E Testing | Pending |
| Production Deployment | Pending |

## License

All rights reserved. Worko is a proprietary project.
