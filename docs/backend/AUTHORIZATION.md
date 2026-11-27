# WORKO — Authorization & RBAC

## Overview

WORKO uses a **Role-Based Access Control (RBAC)** model stored in PostgreSQL and enforced server-side through NestJS guards and decorators. Authorization is **never** delegated to the frontend.

```
Request → AuthGuard → OrgMemberGuard → WorkspaceMemberGuard → PermissionGuard → Handler
```

---

## Architecture

| Component | Location | Purpose |
|---|---|---|
| `AuthzService` | `src/modules/authz/authz.service.ts` | Core RBAC queries and enforcement |
| `OrgMemberGuard` | `src/modules/authz/org-member.guard.ts` | Verifies org membership |
| `WorkspaceMemberGuard` | `src/modules/authz/workspace-member.guard.ts` | Verifies workspace membership |
| `PermissionGuard` | `src/modules/authz/permission.guard.ts` | Checks required permissions |
| `@RequirePermissions()` | `src/modules/authz/require-permissions.decorator.ts` | Declares required permissions on a handler |
| `rbac.constants.ts` | `src/modules/authz/rbac.constants.ts` | Permission keys and system role definitions |
| `AuthzModule` | `src/modules/authz/authz.module.ts` | Global module exporting all authz infrastructure |

---

## Database Schema

The RBAC schema lives in `packages/database/prisma/schema/access.prisma`:

```
roles ──< role_permissions >── permissions
  ↑
organization_members.roleId
workspace_members.roleId
```

### System Roles

| Role Key | Display Name | Scope |
|---|---|---|
| `org_admin` | Organization Admin | `ORGANIZATION` |
| `org_member` | Organization Member | `ORGANIZATION` |
| `ws_manager` | Workspace Manager | `WORKSPACE` |
| `ws_member` | Workspace Member | `WORKSPACE` |

Roles are seeded idempotently on startup by `AuthzService.onModuleInit()`.

---

## Permissions

Permissions follow the `resource:action` convention.

| Permission Key | Description |
|---|---|
| `organization:read` | Read organization details and members |
| `organization:update` | Update organization settings |
| `organization:manage_members` | Add or remove organization members |
| `organization:assign_roles` | Assign roles to organization members |
| `workspace:create` | Create workspaces in an organization |
| `workspace:read` | Read workspace details and members |
| `workspace:update` | Update workspace settings |
| `workspace:manage_members` | Add or remove workspace members |
| `workspace:assign_roles` | Assign roles to workspace members |

### Role → Permission Matrix

| Permission | `org_admin` | `org_member` | `ws_manager` | `ws_member` |
|---|---|---|---|---|
| `organization:read` | ✅ | ✅ | | |
| `organization:update` | ✅ | | | |
| `organization:manage_members` | ✅ | | | |
| `organization:assign_roles` | ✅ | | | |
| `workspace:create` | ✅ | | | |
| `workspace:read` | ✅ | ✅ | ✅ | ✅ |
| `workspace:update` | ✅ | | ✅ | |
| `workspace:manage_members` | ✅ | | ✅ | |
| `workspace:assign_roles` | ✅ | | ✅ | |

---

## Guards

### `OrgMemberGuard`

Applied to routes with `:organizationId` param. Verifies the authenticated user is a member of the organization. Throws `ForbiddenException` if not.

```ts
@UseGuards(AuthGuard, OrgMemberGuard)
@Get(':organizationId')
getOrg(...) {}
```

### `WorkspaceMemberGuard`

Applied to routes with `:workspaceId` param. Verifies:
1. The workspace exists.
2. The authenticated user is a member of the workspace.

```ts
@UseGuards(AuthGuard, WorkspaceMemberGuard)
@Get(':workspaceId')
getWorkspace(...) {}
```

### `PermissionGuard`

Reads the `@RequirePermissions()` metadata and checks the user's effective permissions via `AuthzService.hasPermissions()`.

Must be used **after** `OrgMemberGuard` or `WorkspaceMemberGuard` so the resource context is loaded.

---

## `@RequirePermissions()` Decorator

```ts
@RequirePermissions('organization:update', 'organization:assign_roles')
@Patch(':organizationId')
updateOrg(...) {}
```

Multiple permissions are **AND**-checked — the user must have all listed permissions.

---

## `AuthzService` API

```ts
// Assert org membership (throws ForbiddenException if not member)
await authzService.assertOrganizationMember(userId, organizationId);

// Assert workspace membership
await authzService.assertWorkspaceMember(userId, workspaceId);

// Check if user has all specified permissions within an org
const allowed = await authzService.hasPermissions(userId, organizationId, ['organization:update']);

// Check workspace-scoped permissions
const allowed = await authzService.hasPermissions(userId, workspaceId, ['workspace:manage_members'], 'workspace');
```

---

## Tenant Isolation

> [!CAUTION]
> Never trust `organizationId` or `workspaceId` from request params without verifying membership first. Failure to do so enables IDOR attacks.

Guards enforce isolation automatically:
- `OrgMemberGuard` → user must be a member of the org in the URL
- `WorkspaceMemberGuard` → user must be a member of the workspace **and** the workspace must belong to the org in the URL (when both params are present)

---

## Adding New Permissions

1. Add the key to `PERMISSIONS` in `rbac.constants.ts`
2. Assign it to the relevant role(s) in `SYSTEM_ROLE_DEFINITIONS`
3. Apply `@RequirePermissions('resource:action')` to the handler
4. The next app startup will upsert the new permission via `ensureSystemRbac()`

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---|---|
| Check permissions in service methods | Use guards + `@RequirePermissions()` |
| Hardcode `role === 'admin'` | Use permission keys |
| Trust org/workspace ID from client without guard | Always use `OrgMemberGuard` / `WorkspaceMemberGuard` |
| Put authz logic inside `PrismaService` | Use `AuthzService` |
