# WORKO — Database Verification & Integrity Audit

**Date:** 2026-11-27  
**Database:** PostgreSQL (`db.prisma.io:5432`)  
**ORM:** Prisma 7.10.1 (`@said-bzioui/database`, multi-file schema in `packages/database/prisma/schema/`)

---

## 1. Migration Verification Report

`prisma migrate status` confirmed all 4 migrations are applied and the database schema is up to date without any resets or modifications to previously applied migrations:

| Migration | Status | Notes |
|-----------|--------|-------|
| `20261125192620_better_auth_init` | ✅ Applied | Better Auth base tables (`user`, `session`, `account`, `verification`) |
| `20261126190410_init` | ✅ Applied | Added `password` column to `user` |
| `20261127161730_worko_full_schema` | ✅ Applied | Full 12-domain WORKO schema (55 domain/auth tables + `_prisma_migrations`) |
| `20261127162600_integrity_composite_fks_and_checks` | ✅ Applied | Composite FKs, PostgreSQL `CHECK` constraints, triggers, and index optimizations |

**Schema Sync:** `prisma validate` passed; all 56 tables in PostgreSQL `public` schema match the multi-file Prisma schema. Existing `user` records were preserved untouched.

---

## 2. Referential Integrity Audit

| Relationship / Rule | Before Audit | Resolution |
|---|---|---|
| Organization → Workspace ownership | `workspaces.organizationId → organizations.id` (`CASCADE`) | ✅ Verified (`@@unique([organizationId, slug])`) |
| Workspace → Team / Project ownership | `Project.teamId → Team.id` & `Project.workflowSchemeId → WorkflowScheme.id` did not enforce same-workspace ownership | ✅ Fixed via composite FKs `(teamId, workspaceId) → teams(id, workspaceId)` and `(workflowSchemeId, workspaceId) → workflow_schemes(id, workspaceId)` |
| Project → Issue ownership | `Issue.projectId → Project.id` | ✅ Upgraded with `Issue.workspaceId` and composite FK `(projectId, workspaceId) → projects(id, workspaceId)` |
| Issue → Parent Issue hierarchy | Self-FK `parentId → id` only; cycles and cross-project parents were possible | ✅ Fixed with `CHECK ("parentId" IS NULL OR "parentId" <> "id")` + `trg_issues_hierarchy_integrity` trigger preventing cycles & cross-project parents |
| Issue → Workflow Status consistency | `Issue.statusId → WorkflowStatus.id` allowed cross-workspace status assignment | ✅ Fixed by adding `workspaceId` to `WorkflowStatus` & `Issue` with composite FK `(statusId, workspaceId) → workflow_statuses(id, workspaceId)` |
| WorkflowTransition → Statuses | `fromStatusId` / `toStatusId` could reference statuses from another workflow | ✅ Fixed via composite FKs `(fromStatusId, workflowId)` and `(toStatusId, workflowId)` referencing `workflow_statuses(id, workflowId)` |
| User membership consistency | Unique constraints on `organization_members`, `workspace_members`, `team_members`, `project_members` | ✅ Verified (`(scopeId, userId)` unique on all membership tables) |

---

## 3. Missing Constraints Report (Resolved in `20261127162600_integrity_composite_fks_and_checks`)

### PostgreSQL `CHECK` Constraints Added (10)

| Table | Constraint | Rule |
|---|---|---|
| `projects` | `projects_nextIssueNumber_positive` | `"nextIssueNumber" >= 1` |
| `issues` | `issues_issueNumber_positive` | `"issueNumber" >= 1` |
| `issues` | `issues_no_self_parent` | `"parentId" IS NULL OR "parentId" <> "id"` |
| `issue_links` | `issue_links_no_self_link` | `"sourceIssueId" <> "targetIssueId"` |
| `sprints` | `sprints_valid_date_range` | `"endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate"` |
| `board_columns` | `board_columns_wipLimit_positive` | `"wipLimit" IS NULL OR "wipLimit" > 0` |
| `attachments` | `attachments_sizeBytes_non_negative` | `"sizeBytes" >= 0` |
| `automation_executions` | `automation_executions_retryCount_non_negative` | `"retryCount" >= 0` |
| `webhook_deliveries` | `webhook_deliveries_attemptCount_non_negative` | `"attemptCount" >= 0` |
| `issue_custom_field_values` | `issue_custom_field_values_single_typed_value` | `num_nonnulls("textValue", "numberValue", "booleanValue", "dateValue", "jsonValue") <= 1` |

### PostgreSQL Triggers Added (3)

1. **`trg_issues_hierarchy_integrity`** (`issues`): Prevents direct/indirect circular parent-child hierarchies (recursive CTE) and rejects parent issues belonging to a different `projectId`.
2. **`trg_custom_field_value_type`** (`issue_custom_field_values`): Enforces that the populated value column matches `custom_fields.type` (`TEXT`/`SELECT`/`URL`/`USER` → `textValue`, `NUMBER` → `numberValue`, `BOOLEAN` → `booleanValue`, `DATE` → `dateValue`, `MULTI_SELECT`/`JSON` → `jsonValue`) and verifies same-workspace ownership between `Issue` and `CustomField`.
3. **`trg_audit_logs_append_only`** (`audit_logs`): Blocks `DELETE` and blocks `UPDATE` of audit payload columns (`id`, `action`, `resourceType`, `resourceId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`) while allowing `ON DELETE SET NULL` on nullable FK references.

---

## 4. Index Audit Report

### Redundant Indexes Removed (2)
- `workspaces_organizationId_idx` — redundant with leading column of `workspaces_organizationId_slug_key`.
- `teams_workspaceId_idx` — redundant with leading column of `teams_workspaceId_key`.

### Missing / Upgraded Indexes Added (3)
- `issues_projectId_deletedAt_idx` on `issues(projectId, deletedAt)` — accelerates active (non-soft-deleted) project issue listing.
- `issues_workspaceId_statusId_idx` on `issues(workspaceId, statusId)` — accelerates workspace-wide status queries and supports the composite FK.
- `notifications_userId_readAt_createdAt_idx` on `notifications(userId, readAt, createdAt)` — replaces `notifications_userId_readAt_idx` for sorted unread notification queries.

---

## 5. Integration Test Results

Executed via `pnpm --filter @said-bzioui/database run test` (`packages/database/tests/integrity.test.ts`) against live PostgreSQL (`db.prisma.io`):

```
▶ WORKO Database Integrity & Constraints
  ✔ 1. creates Organization and Workspaces and enforces unique slugs
  ✔ 2. manages Organization & Workspace memberships and prevents duplicates
  ✔ 3. creates Projects and enforces unique key per workspace
  ✔ 4. creates Workflows, Statuses, and enforces same-workflow transitions
  ✔ 5. creates Issues with unique numbering per project
  ✔ 6. enforces Issue parent-child hierarchy and prevents cycles & cross-project parents
  ✔ 7. validates CustomField typed values and prevents wrong-type or multi-column writes
  ✔ 8. prevents cross-tenant relationships via composite foreign keys

tests: 8 | pass: 8 | fail: 0
```

All test records were cleaned up on teardown (and `audit_logs` immutability was verified inside a rolled-back transaction).
