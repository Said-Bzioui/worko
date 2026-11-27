# @said-bzioui/auth-sdk

## 0.1.0

### Minor Changes

- Initial public release of `@said-bzioui/auth-sdk`.
- Provides a configured Better-Auth client and server helpers for the Worko platform.
- Optional React peer dependency (`better-auth/react` client utilities).
- Callers supply `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `DATABASE_URL` at the application layer — no `.env` reads inside the SDK.
