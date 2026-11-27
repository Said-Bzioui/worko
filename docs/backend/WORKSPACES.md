# WORKO — Workspaces API

## Overview

Workspaces sit inside an organization and contain teams, projects, issues, and boards. A user must be an organization member before they can be added to a workspace.

**Base paths:**
- Under org: `/api/v1/organizations/:organizationId/workspaces`
- Direct: `/api/v1/workspaces/:workspaceId`

All endpoints require authentication.

---

## Endpoints

### Create Workspace

```
POST /api/v1/organizations/:organizationId/workspaces
```

**Auth:** Authenticated user  
**Permission:** `workspace:create` (must be org member)  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Request Body:**
```json
{
  "name": "Engineering",
  "slug": "engineering",
  "description": "Main engineering workspace",
  "logoUrl": "https://example.com/ws-logo.png"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | ✅ | 2–100 chars |
| `slug` | string | ✅ | 2–63 chars, lowercase alphanumeric + hyphens, unique within org |
| `description` | string | ❌ | max 500 chars |
| `logoUrl` | string | ❌ | valid URL |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Engineering",
    "slug": "engineering",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

> [!NOTE]
> The creator is automatically assigned `ws_manager` role.

---

### List Organization Workspaces

```
GET /api/v1/organizations/:organizationId/workspaces
```

**Auth:** Authenticated user  
**Permission:** `workspace:read`  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

Returns only workspaces the authenticated user is a **member** of.

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "slug": "engineering",
      "memberCount": 8,
      "projectCount": 3
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

### Get Workspace

```
GET /api/v1/workspaces/:workspaceId
```

**Auth:** Authenticated user  
**Permission:** `workspace:read`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Engineering",
    "slug": "engineering",
    "description": null,
    "logoUrl": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### Update Workspace

```
PATCH /api/v1/workspaces/:workspaceId
```

**Auth:** Authenticated user  
**Permission:** `workspace:update`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Request Body (all fields optional):**
```json
{
  "name": "Platform Engineering",
  "description": "Updated description"
}
```

**Response `200`:** Updated workspace object.

---

### List Workspace Members

```
GET /api/v1/workspaces/:workspaceId/members
```

**Auth:** Authenticated user  
**Permission:** `workspace:read`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "name": "Bob",
      "email": "bob@example.com",
      "role": {
        "key": "ws_manager",
        "name": "Workspace Manager"
      },
      "joinedAt": "2026-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 4 }
}
```

---

### Add Workspace Member

```
POST /api/v1/workspaces/:workspaceId/members
```

**Auth:** Authenticated user  
**Permission:** `workspace:manage_members`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Request Body:**
```json
{
  "userId": "uuid",
  "roleKey": "ws_member"
}
```

> [!IMPORTANT]
> The user being added must already be an **organization member**. Adding a non-org-member to a workspace will return `400`.

**Response `201`:** Created membership object.

---

### Update Workspace Member Role

```
PATCH /api/v1/workspaces/:workspaceId/members/:userId/role
```

**Auth:** Authenticated user  
**Permission:** `workspace:assign_roles`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Request Body:**
```json
{
  "roleKey": "ws_manager"
}
```

| Value | Description |
|---|---|
| `ws_manager` | Manage workspace settings, members, and roles |
| `ws_member` | Standard workspace member with read access |

**Response `200`:** Updated membership object.

---

### Remove Workspace Member

```
DELETE /api/v1/workspaces/:workspaceId/members/:userId
```

**Auth:** Authenticated user  
**Permission:** `workspace:manage_members`  
**Guards:** `WorkspaceMemberGuard`, `PermissionGuard`

**Response `204`:** No content.

---

## Error Responses

| Code | Reason |
|---|---|
| `400` | Validation error or user not in org |
| `401` | Not authenticated |
| `403` | Not a workspace member / insufficient permissions |
| `404` | Workspace not found |
| `409` | Slug already taken within the organization |

---

## Cross-Tenant Isolation Rules

1. A workspace always belongs to exactly one organization.
2. `WorkspaceMemberGuard` verifies:
   - The workspace exists.
   - The authenticated user is a member of the workspace.
3. When both `:organizationId` and `:workspaceId` are present, the workspace's `organizationId` is verified to match the URL's `:organizationId` — preventing cross-org workspace access.
4. A user removed from an organization loses access to all its workspaces.

> [!CAUTION]
> Never query a workspace without first verifying membership. The `WorkspaceMemberGuard` must precede any handler that touches workspace data.
