# WORKO — Development Seed (`DB-03`)

## Overview

The development seed lives in [`packages/database/prisma/seed.ts`](../../packages/database/prisma/seed.ts) and is configured in [`packages/database/prisma.config.ts`](../../packages/database/prisma.config.ts).

### Safety & Idempotency Guarantees
- **Production Guard:** Exits immediately without writing if `NODE_ENV === 'production'`.
- **Transactional:** Executes inside `prisma.$transaction(...)` so partial seed states are never committed.
- **Idempotent:** Uses unique composite keys (`upsert` / existence checks) so re-running never duplicates records or overwrites existing user credentials.

## Seeded Entities

| Entity | Details |
|---|---|
| **Demo Users (4)** | `admin@example.test`, `lead@example.test`, `dev@example.test`, `pm@example.test` |
| **RBAC Roles (2)** | `org_admin` (`ORGANIZATION`), `ws_manager` (`WORKSPACE`) |
| **Organization (1)** | `Worko Demo Organization` (`slug: worko-demo`) |
| **Organization Admin** | `admin@example.test` assigned `org_admin` via `OrganizationRoleAssignment` |
| **Workspace (1)** | `Worko Main Workspace` (`slug: main`, `timezone: UTC`) |
| **Workspace Members (4)** | All 4 demo users with `ACTIVE` membership |
| **Teams (2)** | `Engineering` (`ENG`) & `Product` (`PROD`) with team members |
| **Workflow (1)** | `Software Development Workflow` (`isDefault: true`) |
| **Statuses (5)** | `Backlog`, `To Do`, `In Progress`, `In Review`, `Done` |
| **Transitions (5)** | Standard forward flow + `In Review → In Progress` |
| **Project (1)** | `Worko Platform` (`key: WORKO`, `nextIssueNumber: 5`) |
| **Project Members (4)** | All 4 demo users |
| **Boards (2)** | `WORKO Kanban Board` (5 columns) & `WORKO Scrum Board` (4 columns) |
| **Issues (4)** | `#1 Epic` → `#2 Story` → `#3 Task` → `#4 Subtask` |

## Commands

Run from the monorepo root:

```powershell
pnpm worko:db:seed
```

Or directly via `@said-bzioui/database`:

```powershell
pnpm --filter @said-bzioui/database run prisma:seed
```
