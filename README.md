# WORKFLOW PRO

**WORKFLOW PRO** is a Modular Monolith application organized as a pnpm + Turborepo monorepo.

## Monorepo Structure

```text
worko/
├── apps/
│   ├── backend_api/      # NestJS backend API (Prisma, PostgreSQL, Better Auth)
│   └── frontend_ui/      # React + Vite frontend application (planned/in-progress)
├── packages/             # Shared workspace packages (to be introduced gradually)
├── infrastructure/
│   └── docker/           # Docker and infrastructure configuration
├── docs/
│   ├── architecture/     # Architecture documentation
│   └── adr/              # Architecture Decision Records
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
└── tsconfig.base.json
```

### Folder Roles

- **`apps/`**: Deployable applications (`backend_api`, `frontend_ui`).
- **`packages/`**: Shared internal libraries (e.g., database, contracts, shared utilities, config) introduced gradually.
- **`infrastructure/`**: Containerization, orchestration, and deployment configurations.
- **`docs/`**: System architecture docs and Architecture Decision Records (ADRs).

## Prerequisites

- **Node.js** (v22+ recommended)
- **pnpm** (v12.x)

## Getting Started

### Install Dependencies

From the repository root:

```bash
pnpm install
```

### Available Root Scripts

Root scripts delegate tasks across workspace packages via Turborepo:

- `pnpm build` — Build all workspace packages that define a `build` script.
- `pnpm lint` — Lint all workspace packages that define a `lint` script.
- `pnpm test` — Run tests in all workspace packages that define a `test` script.
- `pnpm dev` — Run persistent `dev` tasks in workspace packages that define a `dev` script.
- `pnpm dev:api` — Start the NestJS backend API in watch mode (`pnpm --filter worko start:dev`).
- `pnpm typecheck` — Run `typecheck` in workspace packages that define it.
- `pnpm clean` — Run `clean` in workspace packages that define it.

> **Note:** Individual applications may define additional app-specific scripts (for example, `apps/backend_api` defines `start:dev`, `test:e2e`, and `prisma:*` scripts). Run them with `pnpm --filter <package-name> <script>`.
