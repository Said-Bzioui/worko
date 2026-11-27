# @said-bzioui/auth-sdk

> WORKO Authentication SDK — Better Auth client wrapper for browser and React applications.

This package provides a typed, opinionated client for WORKO's authentication layer, built on top of [Better Auth](https://better-auth.com). It is consumed by `apps/frontend_ui` and any other consumer that needs to interact with the WORKO auth API from the browser.

---

## Installation

> This package is published to [GitHub Packages](https://npm.pkg.github.com) under the `@said-bzioui` scope.

Authenticate with GitHub Packages once:

```bash
# .npmrc in your project
@said-bzioui:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
pnpm add @said-bzioui/auth-sdk
# or
npm install @said-bzioui/auth-sdk
```

React is an optional peer dependency (required for `useSession`):

```bash
pnpm add react
```

---

## Usage

### Initialize the client

```ts
import { createWorkoAuthClient } from '@said-bzioui/auth-sdk';

export const auth = createWorkoAuthClient({
  baseURL: 'http://localhost:8080',  // Your WORKO backend URL
  basePath: '/api/v1/auth',          // Default — matches WORKO backend
});
```

### Sign up

```ts
await auth.signUpWithEmail({
  name: 'Alice',
  email: 'alice@example.com',
  password: 'SecurePassword123!',
});
```

### Sign in

```ts
await auth.signInWithEmail({
  email: 'alice@example.com',
  password: 'SecurePassword123!',
});
```

### Sign in with social provider

```ts
await auth.signInWithSocial({
  provider: 'github',
  callbackURL: '/dashboard',
});
```

### React session hook

```tsx
import { createWorkoAuthClient } from '@said-bzioui/auth-sdk';

const auth = createWorkoAuthClient({ baseURL: 'http://localhost:8080' });

function ProfileButton() {
  const { data: session, isPending } = auth.useSession();

  if (isPending) return <span>Loading…</span>;
  if (!session) return <a href="/login">Sign in</a>;
  return <span>Hello, {session.user.name}</span>;
}
```

### Sign out

```ts
await auth.signOut();
```

---

## API

### `createWorkoAuthClient(options?): WorkoAuthClient`

| Option | Type | Default | Description |
|---|---|---|---|
| `baseURL` | `string` | Current browser origin | Backend URL |
| `basePath` | `string` | `'/api/v1/auth'` | Auth route prefix |

**Returns:**

| Property | Description |
|---|---|
| `client` | Raw Better Auth client instance |
| `useSession()` | React hook — returns `{ data, isPending, error }` |
| `getSession()` | Promise — returns current session or `null` |
| `signInWithEmail(input)` | Email + password sign in |
| `signUpWithEmail(input)` | Email + password registration |
| `signInWithSocial(input)` | OAuth sign in (GitHub, Google) |
| `signOut()` | Invalidates the session |

---

## Types

```ts
import type {
  AuthClientOptions,
  SignInEmailInput,
  SignUpEmailInput,
  SignInSocialInput,
  SocialProvider,
  WorkoAuthClient,
} from '@said-bzioui/auth-sdk';
```

---

## Development

```bash
# Build the package
pnpm build

# Type-check without emitting
pnpm typecheck

# Clean build output
pnpm clean
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.
