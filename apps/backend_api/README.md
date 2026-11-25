# Worko

Backend API for **Worko**, built with NestJS 12, TypeScript 6 (ESM), Prisma 7, Better Auth, Arcjet, and OpenAPI/Swagger.

## Stack

- **Framework**: NestJS 12 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Language**: TypeScript 6 (strict mode, ESM / `nodenext`)
- **Database**: PostgreSQL with Prisma ORM 7 (`@prisma/client` + `@prisma/adapter-pg`)
- **Authentication**: Better Auth (`better-auth`) with email/password and GitHub/Google OAuth
- **API Docs**: Swagger UI (`@nestjs/swagger`) at `/docs`
- **Security**: Arcjet (`@arcjet/nest`) global guard with shield (WAF) and fixed-window rate limiting
- **Observability**: NestJS Observe (`@nestjs/observe`)
- **Testing & Quality**: Vitest 4, `oxlint --type-aware`, Prettier

## Prerequisites

- Node.js (v22+ recommended)
- `pnpm`
- PostgreSQL database

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000

# Database
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-32-char-high-entropy-secret"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Arcjet
ARCJET_ENV="development"
ARCJET_KEY="ajkey_..."

# NestJS Observe (optional — or run `npx @nestjs/observe link`)
OBSERVE_APP_KEY=""
OBSERVE_APP_SECRET=""
```

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client
pnpm run prisma:generate

# 3. Apply database migrations
pnpm run prisma:migrate

# 4. Start the development server (watch mode, loads .env)
pnpm run start:dev
```

## API & Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **Versioned API**: `http://localhost:3000/api/v1/...`
  - Health check: `GET /api/v1/health`
- **Authentication (Better Auth)**: `http://localhost:3000/api/auth/*`

> Note: Better Auth is mounted on `/api/auth/{*any}` before body parsing so it can read raw request bodies. All NestJS controllers are prefixed with `/api` and URI-versioned (`v1` by default).

## Project Structure

```text
├── auth.config.ts                 # Standalone Better Auth config for CLI schema generation
├── prisma/
│   ├── schema.prisma              # Prisma schema (User, Session, Account, Verification)
│   └── migrations/                # Prisma SQL migrations
├── prisma7.config.ts              # Prisma 7 CLI configuration
├── src/
│   ├── main.ts                    # Bootstrap, Better Auth mount, versioning, Swagger (/docs)
│   ├── app.module.ts              # Root module (Config, Prisma, BetterAuth, Observe, Arcjet)
│   ├── app.controller.ts          # Health endpoint (/api/v1/health)
│   ├── generated/prisma/          # Generated Prisma client (gitignored)
│   └── lib/
│       ├── prisma/                # Global PrismaModule & PrismaService
│       └── better-auth/           # Global BetterAuthModule & BetterAuthService
└── test/                          # E2E tests
```

## Scripts

```bash
# Run
pnpm run start            # Start app
pnpm run start:dev        # Start in watch mode
pnpm run start:debug      # Start with debugger & watch mode
pnpm run start:prod       # Run built dist/main.js

# Build & Quality
pnpm run build            # Build with nest build
pnpm run lint             # Run oxlint --type-aware on src/ and test/
pnpm run format           # Format src/ and test/ with Prettier

# Tests
pnpm run test             # Run unit tests (Vitest)
pnpm run test:watch       # Run unit tests in watch mode
pnpm run test:cov         # Run unit tests with coverage
pnpm run test:e2e         # Run e2e tests

# Database (Prisma)
pnpm run prisma:generate  # Regenerate Prisma client
pnpm run prisma:migrate   # Create & apply dev migration
pnpm run prisma:deploy    # Apply migrations in production
pnpm run prisma:push      # Push schema without migration
pnpm run prisma:studio    # Open Prisma Studio

# Deploy
pnpm run deploy           # Deploy with NestJS Mau
```

## Updating Better Auth Schema

If you enable additional Better Auth plugins or fields in `src/lib/better-auth/better-auth.service.ts`, mirror them in `auth.config.ts` and regenerate the Prisma models:

```bash
npx auth@latest generate --config auth.config.ts --yes
pnpm run prisma:migrate
pnpm run prisma:generate
```
