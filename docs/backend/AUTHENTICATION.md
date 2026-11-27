# WORKO — Authentication

> [!IMPORTANT]
> WORKO uses **Better Auth** as its sole authentication system. Never introduce a second auth system.

## Overview

Authentication is handled by [Better Auth](https://better-auth.com) — a framework-agnostic, type-safe auth library. The NestJS backend delegates all credential management (password hashing, session creation, OAuth, email verification) to Better Auth and only validates sessions on each request.

```
Client → HTTP Request
         → AuthGuard (validates session via Better Auth API)
         → @CurrentUser() param decorator (injects validated user)
         → Controller / Handler
```

---

## Configuration

Better Auth is initialized in `BetterAuthService` (`src/lib/better-auth/better-auth.service.ts`).

Key settings are sourced from environment variables:

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Session signing secret — keep strong & private |
| `BETTER_AUTH_URL` | Public base URL of the backend (`http://localhost:3000`) |
| `DATABASE_URL` | PostgreSQL connection (shared with Prisma) |

The auth handler is mounted at `/api/auth/**` and proxied to Better Auth's internal router inside `AppModule`.

---

## Session Flow

```
1. Client POSTs credentials → POST /api/auth/sign-in/email
2. Better Auth validates credentials, creates a session in `sessions` table
3. Response: Set-Cookie: better-auth.session_token=<token>; HttpOnly; SameSite=Lax
4. Subsequent requests carry the cookie automatically
5. AuthGuard calls betterAuth.api.getSession({ headers }) on every protected route
6. Valid session → user injected via @CurrentUser()
7. Invalid/missing session → 401 Unauthorized
```

---

## AuthGuard

**Location:** `src/lib/better-auth/auth.guard.ts`

```ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = new Headers(/* forwarded request headers */);
    const session = await this.betterAuthService.auth.api.getSession({ headers });

    if (!session?.user) throw new UnauthorizedException('Authentication required');

    request.user = session.user as AuthenticatedUser;
    return true;
  }
}
```

The guard is exported from `BetterAuthModule` and can be applied globally or per-controller.

### Applying Globally

```ts
// app.module.ts
providers: [{ provide: APP_GUARD, useClass: AuthGuard }]
```

### Excluding Routes

Use NestJS's `@Public()` metadata pattern or selectively apply the guard per controller.

---

## `@CurrentUser()` Decorator

**Location:** `src/lib/better-auth/current-user.decorator.ts`

Injects the authenticated user from the request into a controller parameter.

```ts
@Get('profile')
getProfile(@CurrentUser() user: AuthenticatedUser) {
  return { id: user.id, email: user.email, name: user.name };
}
```

### `AuthenticatedUser` Shape

```ts
interface AuthenticatedUser {
  id: string;        // Better Auth user ID (maps to users.id)
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Authentication Endpoints

Better Auth exposes its own endpoints at `/api/auth/**`. These are **not** versioned NestJS endpoints — they are proxied directly.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/sign-up/email` | Register with email & password |
| `POST /api/auth/sign-in/email` | Sign in, receive session cookie |
| `POST /api/auth/sign-out` | Invalidate session |
| `GET /api/auth/session` | Retrieve current session info |
| `POST /api/auth/forget-password` | Send password reset email |
| `POST /api/auth/reset-password` | Complete password reset |

> [!NOTE]
> Social OAuth providers (Google, GitHub) can be added to the Better Auth config without changing the NestJS guard logic.

---

## Security Notes

- **Never expose** passwords, session secrets, or raw tokens in API responses.
- Cookies are `HttpOnly` and `SameSite=Lax` — not accessible via JS.
- For cross-origin frontends, configure `trustedOrigins` in Better Auth config and use `SameSite=None; Secure` in production.
- CSRF protection is built into Better Auth's cookie-based sessions — do not disable it.
- Session tokens are invalidated server-side on sign-out.

---

## Types

```ts
// src/lib/better-auth/auth.types.ts

export interface AuthenticatedUser { ... }

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface TenantContext {
  userId: string;
  organizationId?: string;
  workspaceId?: string;
}
```
