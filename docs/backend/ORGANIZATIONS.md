# WORKO — Organizations API

## Overview

Organizations are the top-level multi-tenant unit. Every workspace, project, and member belongs to an organization.

**Base path:** `/api/v1/organizations`

All endpoints require authentication (session cookie).

---

## Endpoints

### Create Organization

```
POST /api/v1/organizations
```

**Auth:** Authenticated user  
**Permission:** None (any authenticated user can create an org)

**Request Body:**
```json
{
  "name": "Acme Inc",
  "slug": "acme-inc",
  "description": "Optional description",
  "logoUrl": "https://example.com/logo.png"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | ✅ | 2–100 chars |
| `slug` | string | ✅ | 2–63 chars, lowercase alphanumeric + hyphens, unique |
| `description` | string | ❌ | max 500 chars |
| `logoUrl` | string | ❌ | valid URL |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "description": null,
    "logoUrl": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

> [!NOTE]
> The creator is automatically assigned the `org_admin` role via a database transaction.

---

### List My Organizations

```
GET /api/v1/organizations
```

**Auth:** Authenticated user  
**Permission:** None

**Query Params:**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max 100) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Inc",
      "slug": "acme-inc",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

### Get Organization

```
GET /api/v1/organizations/:organizationId
```

**Auth:** Authenticated user  
**Permission:** `organization:read` (member of org)  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "description": null,
    "logoUrl": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "memberCount": 5,
    "workspaceCount": 2
  }
}
```

---

### Update Organization

```
PATCH /api/v1/organizations/:organizationId
```

**Auth:** Authenticated user  
**Permission:** `organization:update`  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Request Body (all fields optional):**
```json
{
  "name": "Acme Corp",
  "description": "Updated description",
  "logoUrl": "https://example.com/new-logo.png"
}
```

> [!NOTE]
> `slug` is immutable after creation to prevent breaking links.

**Response `200`:** Updated organization object.

---

### List Organization Members

```
GET /api/v1/organizations/:organizationId/members
```

**Auth:** Authenticated user  
**Permission:** `organization:read`  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "name": "Alice",
      "email": "alice@example.com",
      "role": {
        "key": "org_admin",
        "name": "Organization Admin"
      },
      "joinedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### Assign Organization Role

```
PATCH /api/v1/organizations/:organizationId/members/:userId/role
```

**Auth:** Authenticated user  
**Permission:** `organization:assign_roles`  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Request Body:**
```json
{
  "roleKey": "org_admin"
}
```

| Value | Description |
|---|---|
| `org_admin` | Full administrative access across the organization and its workspaces |
| `org_member` | Standard organization member with read access |

**Response `200`:** Updated member object.

---

### Remove Organization Member

```
DELETE /api/v1/organizations/:organizationId/members/:userId
```

**Auth:** Authenticated user  
**Permission:** `organization:manage_members`  
**Guards:** `OrgMemberGuard`, `PermissionGuard`

**Response `204`:** No content.

> [!WARNING]
> Removing a member also cascades to remove their workspace memberships within this organization (if cascade is enabled in schema).

---

## Error Responses

| Code | Reason |
|---|---|
| `400` | Validation error (invalid slug format, missing required field) |
| `401` | Not authenticated |
| `403` | Not a member / insufficient permissions |
| `404` | Organization not found |
| `409` | Slug already taken |

---

## Tenant Isolation

- All queries filter by `organizationId` from the URL param.
- `OrgMemberGuard` verifies the authenticated user is a member **before** any handler logic runs.
- Attempting to access another org's data returns `403`, not `404`, to prevent enumeration.
