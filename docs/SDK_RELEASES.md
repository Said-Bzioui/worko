# SDK Release Guide — Worko Monorepo

> This document covers the full release lifecycle for the two publishable SDKs in the Worko monorepo.
> Publishing target: **GitHub Packages only** (Phase 1).

---

## SDKs

| Canonical workspace package | Published GitHub Packages name | Current version |
|---|---|---|
| `@worko/database` | `@said-bzioui/database` | 0.1.0 |
| `@worko/auth-sdk` | `@said-bzioui/auth-sdk` | 0.1.0 |

---

## Release Architecture

```
Developer
   │
   ├─ pnpm changeset          # Describe what changed
   │       └── creates .changeset/<hash>.md
   │
   └─ git push → main
           │
           └─ GitHub Actions: release.yml
                   │
                   ├─ [changesets present]
                   │       └─ Opens/updates "Version Packages" PR
                   │               └─ bumps versions + changelogs
                   │
                   └─ [no changesets / PR merged]
                           └─ pnpm release:build
                           └─ pnpm release:publish   (node scripts/publish-sdks.mjs)
                           └─ git tags: database-vX.Y.Z / auth-sdk-vX.Y.Z
```

---

## Changesets Workflow — Step by Step

### 1. Make your code changes

Edit source files in `packages/database/` or `packages/auth-sdk/`.

### 2. Create a changeset

```bash
pnpm changeset
```

The CLI will:
- Ask which packages changed (`@worko/database`, `@worko/auth-sdk`, or both)
- Ask for the bump type (`major` / `minor` / `patch`)
- Ask for a summary of the change

This creates a file like `.changeset/happy-tigers-dance.md`.

### 3. Commit and push

```bash
git add .changeset/
git commit -m "feat: add new query utilities to database SDK"
git push origin main
```

### 4. The release workflow opens a PR

GitHub Actions detects the new changeset and opens (or updates) a **"Version Packages"** pull request automatically.

This PR:
- Bumps the version in `packages/*/package.json`
- Appends to `packages/*/CHANGELOG.md`
- Removes consumed `.changeset/*.md` files

### 5. Review and merge the PR

Review the bumped versions and changelog entries. Merge when ready.

### 6. Packages are published automatically

After merge, GitHub Actions re-runs `release.yml`. With no changesets remaining, it calls `pnpm release:publish` which runs `scripts/publish-sdks.mjs` — an idempotent publish script that skips already-published versions.

### 7. Git tags are created

Independent tags are pushed for each published package:

```
database-v0.1.0
auth-sdk-v0.1.0
```

---

## Available Commands

| Command | Description |
|---|---|
| `pnpm changeset` | Create a new changeset describing your changes |
| `pnpm version-packages` | Apply pending changesets (bump versions + changelogs) |
| `pnpm release:build` | Build both SDKs (`dist/`) |
| `pnpm release:publish` | Publish built SDKs to GitHub Packages (idempotent) |
| `pnpm release` | Build + publish in one step (local use) |

---

## GitHub Packages Authentication

### Publishing (CI — automated)

The release workflow uses `GITHUB_TOKEN` automatically. No manual token needed for CI.

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Installing packages locally (consumers)

The monorepo keeps the canonical workspace names `@worko/database` and `@worko/auth-sdk`. GitHub Packages publishes them under `@said-bzioui/database` and `@said-bzioui/auth-sdk`, because the npm scope must match the GitHub user or organization that owns the package. `publishConfig.name` applies this mapping only when publishing; source imports and Changesets continue using the canonical names. Consumers install the published names and authenticate with GitHub Packages.

**Step 1 — Install the published name and add to your project `.npmrc`:**

```bash
pnpm add @said-bzioui/database
# and/or
pnpm add @said-bzioui/auth-sdk
```

```
@said-bzioui:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

**Step 2 — Create a GitHub Personal Access Token (PAT):**

- Go to GitHub → Settings → Developer settings → Personal access tokens (classic)
- Scopes needed: `read:packages`

**Step 3 — Export the token in your shell:**

```bash
export GITHUB_PACKAGES_TOKEN=ghp_xxxxxxxxxxxx
```

Or add it to your `.bashrc` / `.zshrc` / `.env.local` (never commit it).

---

## GitHub Packages — Scope Compatibility Note

> **Important:** GitHub Packages requires the npm scope to match the GitHub owner.
> The packages use scope `@worko`, but the GitHub owner is `Said-Bzioui`.

**Solution:** `@worko` does not match the owner `Said-Bzioui`. Each SDK uses pnpm's registry-specific `publishConfig.name` to publish under `@said-bzioui/*`, while the workspace manifest name and source imports remain unchanged. Consumers must install the published `@said-bzioui/*` names.

---

## Required GitHub Repository Settings

### Secrets (Settings → Secrets → Actions)

| Secret | Used By | Required For |
|---|---|---|
| `DATABASE_URL` | CI + Release | Tests, backend build |
| `BETTER_AUTH_SECRET` | CI + Release | Tests, backend build |
| `BETTER_AUTH_URL` | CI + Release | Tests, backend build |
| `BETTER_AUTH_API_KEY` | CI + Release | Tests, backend build |
| `ARCJET_KEY` | CI + Release | Tests, backend build |
| `OBSERVE_APP_KEY` | CI + Release | Tests, backend build |
| `OBSERVE_APP_SECRET` | CI + Release | Tests, backend build |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions — no manual setup needed.

### Workflow Permissions (Settings → Actions → General)

Enable **"Read and write permissions"** for `GITHUB_TOKEN` so the release workflow can:
- Push version commits
- Create pull requests
- Publish packages

---

## Recovery from Partial Publish Failures

If a publish run is interrupted (network error, timeout, etc.):

1. **Re-run `pnpm release:publish`** — the script is idempotent. It checks whether each version is already published before attempting to publish.
2. If a version was partially published and is in a broken state, unpublish it via the GitHub Packages UI (Package settings → Manage versions) and re-run.
3. Git tags are created after publish. If the publish succeeded but the tag push failed, create tags manually:
   ```bash
   git tag database-v0.1.0
   git push origin database-v0.1.0
   ```

---

## Troubleshooting

### `403 Forbidden` on publish

- **Cause 1:** `GITHUB_TOKEN` lacks `packages: write`. Check workflow `permissions:`.
- **Cause 2:** Published npm scope does not match the GitHub owner. Confirm `publishConfig.name` uses `@said-bzioui/*`.
- **Cause 3:** Package `private: true`. Both SDKs must have `"private": false`.

### `409 Conflict` / "version already exists"

The publish script skips already-published versions automatically. If `npm publish` returns a 409, it is treated as a success.

### `ENEEDAUTH` / authentication error

The `NODE_AUTH_TOKEN` environment variable must be set. In CI it is set to `GITHUB_TOKEN`. Locally it must point to a PAT with `write:packages`.

### Changeset status shows unexpected packages

Run `pnpm changeset status` to see what changesets are pending. Accidentally included a private package? Add it to `"ignore"` in `.changeset/config.json`.

### Tests fail in CI but pass locally

Ensure all required secrets are added in GitHub repository settings. Missing secrets cause env vars to be empty strings which breaks the backend build and tests.

---

## Monorepo `.npmrc` Reference

```ini
# pnpm settings
auto-install-peers=true
strict-peer-dependencies=false

# GitHub Packages — publication namespace matches the GitHub owner
@said-bzioui:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

The `NODE_AUTH_TOKEN` variable is injected by `actions/setup-node` in CI and must be set manually for local publishing.
