# WORKFLOW PRO (WORKO)

NestJS 12.0.15, Express adapter, TypeScript 6.0.2, ES modules.

## Stack

- **Framework**: NestJS 12 (@nestjs/common, @nestjs/core, @nestjs/platform-express)
- **Language**: TypeScript 6, strict mode, target ES2023, `module`/`moduleResolution: nodenext`
- **Module system**: ESM (`"type": "module"`). Use `.js` extensions in relative imports (e.g. `import { X } from './x.service.js'`)
- **Package manager**: pnpm
- **Lint**: oxlint (type-aware): `oxlint --type-aware src/ test/`
- **Format**: Prettier (singleQuote, trailingComma: all)
- **Tests**: vitest 4 (unit: `**/*.spec.ts`; e2e: `**/*.e2e-spec.ts` via separate config)
- **Observability**: @nestjs/observe (instrumented in AppModule via `createObserveModule`)
- **Config**: @nestjs/config (`ConfigModule.forRoot({ isGlobal: true })`)
- **Security**: @arcjet/nest — Arcjet global guard (`APP_GUARD`) with shield (WAF) and fixed-window rate limiting. Key from `ARCJET_KEY`, env via `ARCJET_ENV`.
- **Database**: Prisma ORM 7 (`@prisma/client`) with `@prisma/adapter-pg` driver. Global `PrismaModule` (`src/lib/prisma/`) exporting `PrismaService`. Schema: `prisma/schema.prisma`. Generated client: `src/generated/prisma/`.
- **Deploy**: @nestjs/mau (`nest deploy`)

## Role

You are a senior NestJS developer. Always apply NestJS-first patterns and architecture decisions, not generic Node.js approaches. Think in modules, providers, controllers, guards, interceptors, and pipes.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`, no `new SomeService()`) — always use constructor injection
- Every infrastructure integration gets its own module and service: `src/lib/<name>/<name>.module.ts` + `<name>.service.ts`
- Mark infrastructure modules `@Global()` and import once in AppModule
- Feature modules go in `src/module/<name>/`
- Shared guards, interceptors, decorators, pipes go in `src/common/`
- Use Nest CLI to scaffold: `nest g module`, `nest g service`, `nest g controller`
- Relative imports require the `.js` extension (ESM + nodenext)
- TypeScript strict is on; `no-explicit-any` is off but prefer typed code; `no-floating-promises` is an error
- Env vars are loaded via `--env-file .env` in `start` scripts; never hardcode secrets

## Commands

```bash
pnpm run start:dev      # watch mode with .env
pnpm run build          # nest build
pnpm run lint           # oxlint --type-aware src/ test/
pnpm run test           # vitest run (unit)
pnpm run test:e2e       # vitest run --config ./vitest.config.e2e.ts
pnpm run deploy         # nest deploy (Mau)
pnpm run prisma:generate  # prisma generate (regenerate client)
pnpm run prisma:migrate   # prisma migrate dev (create + apply migration)
pnpm run prisma:deploy    # prisma migrate deploy (apply in production)
pnpm run prisma:push      # prisma db push (push schema without migration)
pnpm run prisma:studio    # prisma studio (GUI for database)
```

## Security (Arcjet)

Arcjet is registered as a global `APP_GUARD` in `src/app.module.ts` via `ArcjetModule.forRoot({ isGlobal: true })`. Every request passes through two rules in `LIVE` mode:

- **shield** — blocks common application-layer attacks (SQL injection, XSS, etc.)
- **fixedWindow** — rate limit per client IP: max 100 requests per 60s window

Required env vars (set in `.env`, loaded via `--env-file .env` and `ConfigModule`):

- `ARCJET_KEY` — Arcjet API key
- `ARCJET_ENV` — e.g. `development` (see https://docs.arcjet.com/environment#arcjet-env)

To adjust rate limits or switch rules to log-only, edit the `rules` array in `ArcjetModule.forRoot`. Use `mode: 'DRY_RUN'` instead of `'LIVE'` to log without blocking.

## Database (Prisma)

Prisma ORM 7 with the `@prisma/adapter-pg` driver adapter. The database layer follows the project's infrastructure-module convention.

### Files

- **Schema**: `prisma/schema.prisma` — defines models and datasource
- **Config**: `prisma7.config.ts` — CLI config (schema path, migrations path, `DATABASE_URL`)
- **Module**: `src/lib/prisma/prisma.module.ts` — `@Global()` module, exports `PrismaService`
- **Service**: `src/lib/prisma/prisma.service.ts` — extends `PrismaClient`, connects via `PrismaPg` adapter on `OnModuleInit`, disconnects on `OnModuleDestroy`
- **Generated client**: `src/generated/prisma/` (gitignored) — output of `prisma generate`

### Usage

Inject `PrismaService` into any feature service via constructor injection (it's global, no import needed):

```ts
constructor(private readonly prisma: PrismaService) {}
```

Then use it like the standard Prisma Client:

```ts
const users = await this.prisma.user.findMany();
```

### Env vars

- `DATABASE_URL` — PostgreSQL connection string (set in `.env`, loaded by `prisma7.config.ts` via `dotenv/config`)

### Workflow

1. Edit models in `prisma/schema.prisma`
2. Run `pnpm run prisma:generate` to regenerate the client
3. Run `pnpm run prisma:migrate` to create and apply a migration (dev)
4. In production, run `pnpm run prisma:deploy` to apply pending migrations

Do not instantiate `PrismaClient` directly — always inject `PrismaService`.


## Agent skills

All skills live in `.agents/skills/`. Do not load any skill by default. Check the task first — only invoke a skill if it matches the trigger below. Never invoke a skill just because it exists.

| Skill | Trigger | What it does |
|---|---|---|
| **scope** | `/scope` | Turn a product idea into a living, coarse scope in `docs/scope/`. Plan, replan, or enroll a feature. Seeds WHAT to build. |
| **architect** | `/architect` | Choose between approaches, design a feature/page, pick a stack, or resolve a load-bearing decision. Writes a build spec to `docs/specs/`. Run before building something non-trivial with no spec yet. |
| **develop** | `/develop` | Build a feature (UI or backend) from an approved spec. If a load-bearing decision is unrecorded, it stops and routes to `/architect`. |
| **check** | `/check verify` or `/check review` | Gate before merge. `verify` runs the real app against the spec; `review` is a fresh-model senior code review. Writes to `docs/reviews/`. |
| **test** | `/test` | Write a test suite for uncommitted changes. Reads `test-preferences.json` (asks and saves it on first run). Strategy per file: happy path, edges, errors. |
| **debug** | `/debug` | Find and fix a bug's root cause via reproduce, localize, hypothesize, test, fix, verify. Minimal fix only, no feature work. |
| **document** | `/document pr|changelog|release-note|postmortem` | Write human-facing prose from real commits/diff. PR body, CHANGELOG entry, release notes, or postmortem. |
| **sync** | `/sync` | Last step after a change is complete. Keeps AGENTS.md files, scope, and spec status lines current against the repo. Surgical edits only. |
| **audit** | `/audit [area]` | Bootstrap AGENTS.md context files for a greenfield or undocumented codebase. Adds only what is missing; never overwrites curated content. |

## Session continuity

REQUIRED — do not skip, do not wait to be asked:

- **First action of every session:** restore context from `docs/scope/` and `docs/specs/` (if they exist) before doing anything else.
- **Last action of every session:** run `/sync` to reconcile durable knowledge before closing.

## Artifact layout

- `docs/scope/` — owned by `/scope`. Feature scope, coarse and living.
- `docs/specs/` — owned by `/architect`. Build specs with decisions and rationale.
- `docs/reviews/` — owned by `/check review`. Code review findings.
- `docs/releases/`, `docs/postmortems/`, `CHANGELOG.md` — owned by `/document`.
- `AGENTS.md` (root + nested) — maintained by `/audit` and `/sync`.
- `CLAUDE.md` — one-line pointer importing `AGENTS.md`.
