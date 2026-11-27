<div align="center">
  <img src="./docs/banner.png" alt="WORKO banner" width="520" />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

# Worko

Worko is a project and workflow management platform for teams. It is being built to help organizations coordinate people and projects in one place, with configurable workflows and clear access rules.

Work is organized in this hierarchy:

**Organization → Workspace → Team → Project → Board → Issue**

An organization represents a company. Workspaces separate areas of work inside it. Teams and projects organize the people and work, while boards and issues are intended to track delivery.

## What Worko does

Worko is designed for teams that need more than a shared task list. Its product direction includes:

- Separate organizations and workspaces for different companies and teams.
- Roles and permissions that control who can view or manage each area.
- Projects, boards, issues, and configurable workflows.
- Background processing for work that should not block an API request.

The project is under active development. The API currently covers authentication, users, organizations, workspaces, memberships, and role assignment. The database schema includes the broader project and workflow model, but project and issue management screens and APIs are not complete yet. The frontend currently provides an application shell and home page. The notification worker is a processing foundation and does not deliver messages to an external provider yet.

## How Worko works

1. A user signs in with email and password. GitHub and Google sign-in can be configured.
2. The user creates an organization. Worko records the creator as an organization administrator.
3. The administrator creates workspaces and adds organization members to them.
4. The API checks membership and permissions before returning or changing organization and workspace data.
5. PostgreSQL stores application data. The shared database package owns the Prisma schema, migrations, and client used by the API and worker.
6. The API can place background jobs on a BullMQ queue in Redis. The separate worker reads jobs and runs their handlers.

The request path is:

    Browser → React frontend → NestJS API → Prisma database package → PostgreSQL
                                      └→ BullMQ queue → Redis → Worker

## Current implementation

| Area | Current state |
|---|---|
| Authentication | Better Auth email and password, with optional GitHub and Google providers |
| Organizations and workspaces | Create, list, view, update, and manage members through the API |
| Authorization | Organization and workspace membership checks with role-based permissions |
| Database | PostgreSQL schema and migrations managed by Prisma 7 |
| Background jobs | BullMQ queue and worker are wired; notification handler currently logs jobs |
| Frontend | React application shell with a home page; project management UI is still in progress |
| Projects, boards, and issues | Database model is prepared; product APIs and screens are not complete |

## Architecture

| Component | Location | Responsibility |
|---|---|---|
| Web frontend | apps/frontend_ui | React, TypeScript, Vite, and Tailwind CSS |
| Backend API | apps/backend_api | NestJS endpoints, authentication, authorization, validation, and API security |
| Database SDK | packages/database | Shared Prisma client, schema, migrations, and database helpers |
| Authentication SDK | packages/auth-sdk | Browser client for Worko authentication |
| Background worker | apps/worker | Processes BullMQ jobs from Redis |
| CLI | tools/cli | Local commands for inspecting routes and checking service health |
| Local infrastructure | infrastructure/docker | PostgreSQL and Redis through Docker Compose |

## Run Worko locally

### Requirements

- Node.js 22 or newer
- pnpm 12
- Docker Desktop, for local PostgreSQL and Redis

### Install and start the database services

    git clone https://github.com/Said-Bzioui/worko.git
    cd worko
    pnpm install
    pnpm worko:docker:up

Docker Compose starts PostgreSQL on port 5432 and Redis on port 6379.

### Configure environment

Create **apps/backend_api/.env** for the API:

    PORT=3000
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow_pro?schema=public
    BETTER_AUTH_SECRET=replace-with-a-long-random-secret
    BETTER_AUTH_URL=http://localhost:3000
    ARCJET_ENV=development
    ARCJET_KEY=your-arcjet-key

The frontend development proxy expects the API at http://localhost:3000. The API also needs a valid Arcjet key to start. Add GitHub or Google OAuth credentials only if you want to enable those providers.

For the worker, create **apps/worker/.env** with DATABASE_URL and REDIS_URL=redis://localhost:6379.

Prisma commands read environment variables from **packages/database/.env**. Create that file with the same DATABASE_URL before running migrations.

Keep real secrets out of Git. Do not commit any .env files.

### Migrate, build, and run

    pnpm worko:db:migrate
    pnpm build
    pnpm worko:dev

The API runs at http://localhost:3000, the frontend at http://localhost:5173, and the API reference is at http://localhost:3000/docs in development.

To start one app at a time, use:

    pnpm worko:backend:dev
    pnpm worko:frontend:dev
    pnpm worko:worker:dev

## Useful commands

| Command | What it does |
|---|---|
| pnpm build | Builds the workspace packages and applications |
| pnpm test | Runs the configured test tasks |
| pnpm typecheck | Checks TypeScript across the workspace |
| pnpm worko:db:migrate | Creates and applies a development migration |
| pnpm worko:db:deploy | Applies existing migrations |
| pnpm worko:db:seed | Loads development seed data |
| pnpm worko:routes | Lists API routes |
| pnpm worko:health | Checks service health |
| pnpm worko:docker:down | Stops local PostgreSQL and Redis |

## API overview

The API uses the /api/v1 prefix.

- Authentication: /api/v1/auth/*
- Organizations: /api/v1/organizations
- Workspaces: /api/v1/organizations/:organizationId/workspaces and /api/v1/workspaces/:workspaceId
- Users: /api/v1/users
- Health check: /api/v1/health
- Swagger API reference: /docs in development

Organization and workspace endpoints require an authenticated session. Member-only operations also check the caller's role and permissions.

## Documentation

- [Product and data model](docs/PRD.md)
- [Database design](docs/ERD.md)
- [Organizations API](docs/backend/ORGANIZATIONS.md)
- [Workspaces API](docs/backend/WORKSPACES.md)
- [Authentication](docs/backend/AUTHENTICATION.md)
- [Authorization](docs/backend/AUTHORIZATION.md)
- [SDK release process](docs/SDK_RELEASES.md)

## License

WORKO is a proprietary project. All rights reserved.
