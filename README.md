# Worko

**Worko** is a modern, scalable full-stack platform built with a TypeScript monorepo architecture.

The project uses **NestJS, React, Prisma, PostgreSQL, Redis, BullMQ, and Better Auth**, with shared workspace packages, independent applications, and centralized Docker & CI infrastructure.

## Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/BullMQ-E11D48?style=for-the-badge&logo=redis&logoColor=white" alt="BullMQ" />
  <img src="https://img.shields.io/badge/Better_Auth-18181B?style=for-the-badge&logo=shield&logoColor=white" alt="Better Auth" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
</p>

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
│   └── worker/            # BullMQ background job processor ("@worko/worker")
├── packages/
│   ├── database/          # Centralized Prisma 7 infrastructure ("@worko/database")
│   └── auth-sdk/          # Better Auth client SDK ("@worko/auth-sdk")
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
- PostgreSQL integration through `@worko/database` (`PrismaService` + `@prisma/adapter-pg`).
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
- Shared authentication via `@worko/auth-sdk` (`src/lib/auth-client.ts`).

### 3. Background Worker (`apps/worker` — `@worko/worker`)

An independent Node.js process responsible for asynchronous background jobs.

- BullMQ `Worker` listening on the `worko-jobs` queue via Redis.
- Shared PostgreSQL access through `@worko/database` (`createPrismaClient()`).
- Graceful `SIGINT`/`SIGTERM` shutdown.

## Shared Packages

| Package | Path | Responsibility |
| --- | --- | --- |
| `@worko/database` | `packages/database` | Centralized Prisma 7 schema, migrations, generated client, and `pg` adapter |
| `@worko/auth-sdk` | `packages/auth-sdk` | Type-safe Better Auth client (`emailAndPassword`, `github`/`google` social, sessions) |

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
pnpm --filter @worko/database build
pnpm --filter @worko/auth-sdk build
```

### 6. Run database migrations

```bash
pnpm --filter @worko/database prisma:migrate
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

### Database (`@worko/database`)

| Command | Description |
| --- | --- |
| `pnpm --filter @worko/database prisma:generate` | Generate Prisma Client |
| `pnpm --filter @worko/database prisma:migrate` | Create and apply development migrations |
| `pnpm --filter @worko/database prisma:deploy` | Apply production migrations |
| `pnpm --filter @worko/database prisma:push` | Push schema changes |
| `pnpm --filter @worko/database prisma:studio` | Open Prisma Studio |

### Docker

| Command | Description |
| --- | --- |
| `pnpm docker:up` | Start PostgreSQL and Redis |
| `pnpm docker:down` | Stop infrastructure services |

### Individual Apps

```bash
pnpm --filter worko start:dev              # Backend API
pnpm --filter frontend dev                 # Frontend UI
pnpm --filter @worko/worker dev     # Background Worker
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
2. Build shared packages (`@worko/database`, `@worko/auth-sdk`)
3. Typecheck (`@worko/worker`, `frontend`)
4. Lint (`worko`, `frontend`)
5. Build apps (`worko`, `@worko/worker`, `frontend`)
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
