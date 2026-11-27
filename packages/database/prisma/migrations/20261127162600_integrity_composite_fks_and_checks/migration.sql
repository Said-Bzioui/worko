-- DropForeignKey
ALTER TABLE "issues" DROP CONSTRAINT "issues_projectId_fkey";

-- DropForeignKey
ALTER TABLE "issues" DROP CONSTRAINT "issues_statusId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_teamId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_workflowSchemeId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_statuses" DROP CONSTRAINT "workflow_statuses_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_transitions" DROP CONSTRAINT "workflow_transitions_fromStatusId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_transitions" DROP CONSTRAINT "workflow_transitions_toStatusId_fkey";

-- DropIndex
DROP INDEX "notifications_userId_readAt_idx";

-- DropIndex
DROP INDEX "teams_workspaceId_idx";

-- DropIndex
DROP INDEX "workspaces_organizationId_idx";

-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "workspaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "workflow_statuses" ADD COLUMN     "workspaceId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "issues_projectId_deletedAt_idx" ON "issues"("projectId", "deletedAt");

-- CreateIndex
CREATE INDEX "issues_workspaceId_statusId_idx" ON "issues"("workspaceId", "statusId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "teams_id_workspaceId_key" ON "teams"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_schemes_id_workspaceId_key" ON "workflow_schemes"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_statuses_id_workspaceId_key" ON "workflow_statuses"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_id_workspaceId_key" ON "workflows"("id", "workspaceId");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_projectId_workspaceId_fkey" FOREIGN KEY ("projectId", "workspaceId") REFERENCES "projects"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_statusId_workspaceId_fkey" FOREIGN KEY ("statusId", "workspaceId") REFERENCES "workflow_statuses"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_teamId_workspaceId_fkey" FOREIGN KEY ("teamId", "workspaceId") REFERENCES "teams"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflowSchemeId_workspaceId_fkey" FOREIGN KEY ("workflowSchemeId", "workspaceId") REFERENCES "workflow_schemes"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_statuses" ADD CONSTRAINT "workflow_statuses_workflowId_workspaceId_fkey" FOREIGN KEY ("workflowId", "workspaceId") REFERENCES "workflows"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_statuses" ADD CONSTRAINT "workflow_statuses_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_fromStatusId_workflowId_fkey" FOREIGN KEY ("fromStatusId", "workflowId") REFERENCES "workflow_statuses"("id", "workflowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_toStatusId_workflowId_fkey" FOREIGN KEY ("toStatusId", "workflowId") REFERENCES "workflow_statuses"("id", "workflowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- PostgreSQL CHECK Constraints
-- ============================================================================

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_nextIssueNumber_positive" CHECK ("nextIssueNumber" >= 1);

ALTER TABLE "issues"
  ADD CONSTRAINT "issues_issueNumber_positive" CHECK ("issueNumber" >= 1),
  ADD CONSTRAINT "issues_no_self_parent" CHECK ("parentId" IS NULL OR "parentId" <> "id");

ALTER TABLE "issue_links"
  ADD CONSTRAINT "issue_links_no_self_link" CHECK ("sourceIssueId" <> "targetIssueId");

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_valid_date_range" CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "board_columns"
  ADD CONSTRAINT "board_columns_wipLimit_positive" CHECK ("wipLimit" IS NULL OR "wipLimit" > 0);

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_sizeBytes_non_negative" CHECK ("sizeBytes" >= 0);

ALTER TABLE "automation_executions"
  ADD CONSTRAINT "automation_executions_retryCount_non_negative" CHECK ("retryCount" >= 0);

ALTER TABLE "webhook_deliveries"
  ADD CONSTRAINT "webhook_deliveries_attemptCount_non_negative" CHECK ("attemptCount" >= 0);

ALTER TABLE "issue_custom_field_values"
  ADD CONSTRAINT "issue_custom_field_values_single_typed_value"
  CHECK (num_nonnulls("textValue", "numberValue", "booleanValue", "dateValue", "jsonValue") <= 1);

-- ============================================================================
-- PostgreSQL Integrity Triggers
-- ============================================================================

-- 1. Issue hierarchy: prevent cycles and cross-project parents
CREATE OR REPLACE FUNCTION prevent_issue_hierarchy_cycle()
RETURNS TRIGGER AS $$
DECLARE
  parent_project_id UUID;
  has_cycle BOOLEAN;
BEGIN
  IF NEW."parentId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."parentId" = NEW."id" THEN
    RAISE EXCEPTION 'Issue cannot be its own parent (id: %)', NEW."id";
  END IF;

  SELECT "projectId" INTO parent_project_id
  FROM "issues"
  WHERE "id" = NEW."parentId";

  IF parent_project_id IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'Parent issue (%) must belong to the same project (%)', NEW."parentId", NEW."projectId";
  END IF;

  WITH RECURSIVE ancestors AS (
    SELECT "id", "parentId"
    FROM "issues"
    WHERE "id" = NEW."parentId"
    UNION ALL
    SELECT i."id", i."parentId"
    FROM "issues" i
    INNER JOIN ancestors a ON i."id" = a."parentId"
  )
  SELECT EXISTS (SELECT 1 FROM ancestors WHERE "id" = NEW."id") INTO has_cycle;

  IF has_cycle THEN
    RAISE EXCEPTION 'Circular issue hierarchy detected for issue %', NEW."id";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_issues_hierarchy_integrity
  BEFORE INSERT OR UPDATE OF "parentId", "projectId" ON "issues"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_issue_hierarchy_cycle();

-- 2. Custom field typed-value & workspace consistency
CREATE OR REPLACE FUNCTION enforce_custom_field_value_type()
RETURNS TRIGGER AS $$
DECLARE
  field_type "CustomFieldType";
  field_workspace_id UUID;
  issue_workspace_id UUID;
BEGIN
  SELECT "type", "workspaceId" INTO field_type, field_workspace_id
  FROM "custom_fields"
  WHERE "id" = NEW."fieldId";

  SELECT "workspaceId" INTO issue_workspace_id
  FROM "issues"
  WHERE "id" = NEW."issueId";

  IF field_workspace_id IS DISTINCT FROM issue_workspace_id THEN
    RAISE EXCEPTION 'Custom field (%) and issue (%) belong to different workspaces', NEW."fieldId", NEW."issueId";
  END IF;

  IF field_type IN ('TEXT', 'SELECT', 'URL', 'USER') THEN
    IF NEW."numberValue" IS NOT NULL OR NEW."booleanValue" IS NOT NULL OR NEW."dateValue" IS NOT NULL OR NEW."jsonValue" IS NOT NULL THEN
      RAISE EXCEPTION 'Custom field type % requires textValue only', field_type;
    END IF;
  ELSIF field_type = 'NUMBER' THEN
    IF NEW."textValue" IS NOT NULL OR NEW."booleanValue" IS NOT NULL OR NEW."dateValue" IS NOT NULL OR NEW."jsonValue" IS NOT NULL THEN
      RAISE EXCEPTION 'Custom field type NUMBER requires numberValue only';
    END IF;
  ELSIF field_type = 'BOOLEAN' THEN
    IF NEW."textValue" IS NOT NULL OR NEW."numberValue" IS NOT NULL OR NEW."dateValue" IS NOT NULL OR NEW."jsonValue" IS NOT NULL THEN
      RAISE EXCEPTION 'Custom field type BOOLEAN requires booleanValue only';
    END IF;
  ELSIF field_type = 'DATE' THEN
    IF NEW."textValue" IS NOT NULL OR NEW."numberValue" IS NOT NULL OR NEW."booleanValue" IS NOT NULL OR NEW."jsonValue" IS NOT NULL THEN
      RAISE EXCEPTION 'Custom field type DATE requires dateValue only';
    END IF;
  ELSIF field_type IN ('MULTI_SELECT', 'JSON') THEN
    IF NEW."textValue" IS NOT NULL OR NEW."numberValue" IS NOT NULL OR NEW."booleanValue" IS NOT NULL OR NEW."dateValue" IS NOT NULL THEN
      RAISE EXCEPTION 'Custom field type % requires jsonValue only', field_type;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custom_field_value_type
  BEFORE INSERT OR UPDATE ON "issue_custom_field_values"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_custom_field_value_type();

-- 3. AuditLog append-only enforcement (allows FK ON DELETE SET NULL only)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs is append-only: DELETE is forbidden';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW."id" IS DISTINCT FROM OLD."id"
       OR NEW."action" IS DISTINCT FROM OLD."action"
       OR NEW."resourceType" IS DISTINCT FROM OLD."resourceType"
       OR NEW."resourceId" IS DISTINCT FROM OLD."resourceId"
       OR NEW."metadata" IS DISTINCT FROM OLD."metadata"
       OR NEW."ipAddress" IS DISTINCT FROM OLD."ipAddress"
       OR NEW."userAgent" IS DISTINCT FROM OLD."userAgent"
       OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
      RAISE EXCEPTION 'audit_logs is append-only: UPDATE of audit payload is forbidden';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();
