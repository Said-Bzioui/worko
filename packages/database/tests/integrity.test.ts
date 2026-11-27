import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPrismaClient, Pool } from '../src/index.js';

const prisma = createPrismaClient(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const runId = Date.now().toString(36);

// Track created IDs for clean teardown in reverse dependency order
const created = {
  issueIds: [] as string[],
  projectIds: [] as string[],
  teamIds: [] as string[],
  workflowIds: [] as string[],
  workspaceIds: [] as string[],
  orgIds: [] as string[],
  userIds: [] as string[],
};

after(async () => {
  try {
    if (created.issueIds.length) {
      await prisma.issueCustomFieldValue.deleteMany({ where: { issueId: { in: created.issueIds } } });
      await prisma.issueLink.deleteMany({
        where: {
          OR: [
            { sourceIssueId: { in: created.issueIds } },
            { targetIssueId: { in: created.issueIds } },
          ],
        },
      });
      // Clear parentId before deleting issues (onDelete: Restrict)
      await prisma.issue.updateMany({
        where: { id: { in: created.issueIds } },
        data: { parentId: null },
      });
      await prisma.issue.deleteMany({ where: { id: { in: created.issueIds } } });
    }
    if (created.projectIds.length) {
      await prisma.project.deleteMany({ where: { id: { in: created.projectIds } } });
    }
    if (created.teamIds.length) {
      await prisma.team.deleteMany({ where: { id: { in: created.teamIds } } });
    }
    if (created.workflowIds.length) {
      await prisma.workflow.deleteMany({ where: { id: { in: created.workflowIds } } });
    }
    if (created.workspaceIds.length) {
      await prisma.customField.deleteMany({ where: { workspaceId: { in: created.workspaceIds } } });
      await prisma.workspace.deleteMany({ where: { id: { in: created.workspaceIds } } });
    }
    if (created.orgIds.length) {
      await prisma.organization.deleteMany({ where: { id: { in: created.orgIds } } });
    }
    if (created.userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
});

describe('WORKO Database Integrity & Constraints', () => {
  let userId: string;
  let orgId: string;
  let wsAId: string;
  let wsBId: string;
  let wfAId: string;
  let statusTodoAId: string;
  let statusDoneAId: string;
  let statusTodoBId: string;
  let projectAId: string;
  let projectBId: string;
  let issue1Id: string;
  let issue2Id: string;

  it('1. creates Organization and Workspaces and enforces unique slugs', async () => {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: 'Audit Test User',
        email: `audit-${runId}@example.test`,
      },
    });
    userId = user.id;
    created.userIds.push(userId);

    const org = await prisma.organization.create({
      data: { name: 'Audit Org', slug: `audit-org-${runId}` },
    });
    orgId = org.id;
    created.orgIds.push(orgId);

    const wsA = await prisma.workspace.create({
      data: { organizationId: orgId, name: 'Workspace A', slug: 'ws-a' },
    });
    wsAId = wsA.id;
    created.workspaceIds.push(wsAId);

    const wsB = await prisma.workspace.create({
      data: { organizationId: orgId, name: 'Workspace B', slug: 'ws-b' },
    });
    wsBId = wsB.id;
    created.workspaceIds.push(wsBId);

    // Duplicate workspace slug in same org must fail
    await assert.rejects(
      () => prisma.workspace.create({
        data: { organizationId: orgId, name: 'Dup WS', slug: 'ws-a' },
      }),
    );
  });

  it('2. manages Organization & Workspace memberships and prevents duplicates', async () => {
    const orgMember = await prisma.organizationMember.create({
      data: { organizationId: orgId, userId, status: 'ACTIVE', joinedAt: new Date() },
    });
    assert.equal(orgMember.status, 'ACTIVE');

    await assert.rejects(
      () => prisma.organizationMember.create({
        data: { organizationId: orgId, userId, status: 'ACTIVE' },
      }),
    );

    const wsMember = await prisma.workspaceMember.create({
      data: { workspaceId: wsAId, userId, status: 'ACTIVE' },
    });
    assert.equal(wsMember.workspaceId, wsAId);

    await assert.rejects(
      () => prisma.workspaceMember.create({
        data: { workspaceId: wsAId, userId, status: 'INVITED' },
      }),
    );
  });

  it('3. creates Projects and enforces unique key per workspace', async () => {
    const projA = await prisma.project.create({
      data: { workspaceId: wsAId, name: 'Project Alpha', key: 'WRK', status: 'ACTIVE' },
    });
    projectAId = projA.id;
    created.projectIds.push(projectAId);

    // Duplicate key in same workspace must fail
    await assert.rejects(
      () => prisma.project.create({
        data: { workspaceId: wsAId, name: 'Project Dup', key: 'WRK' },
      }),
    );

    // Same key in different workspace is allowed
    const projB = await prisma.project.create({
      data: { workspaceId: wsBId, name: 'Project Beta', key: 'WRK', status: 'ACTIVE' },
    });
    projectBId = projB.id;
    created.projectIds.push(projectBId);
  });

  it('4. creates Workflows, Statuses, and enforces same-workflow transitions', async () => {
    const wfA = await prisma.workflow.create({
      data: { workspaceId: wsAId, name: 'Default Flow', isDefault: true },
    });
    wfAId = wfA.id;
    created.workflowIds.push(wfAId);

    const sTodo = await prisma.workflowStatus.create({
      data: { workflowId: wfAId, workspaceId: wsAId, name: 'To Do', category: 'TO_DO', position: 0 },
    });
    statusTodoAId = sTodo.id;

    const sDone = await prisma.workflowStatus.create({
      data: { workflowId: wfAId, workspaceId: wsAId, name: 'Done', category: 'DONE', position: 1 },
    });
    statusDoneAId = sDone.id;

    // Valid transition within wfA
    const tr = await prisma.workflowTransition.create({
      data: { workflowId: wfAId, fromStatusId: statusTodoAId, toStatusId: statusDoneAId, name: 'Complete' },
    });
    assert.equal(tr.workflowId, wfAId);

    // Create workflow + status in Workspace B
    const wfB = await prisma.workflow.create({
      data: { workspaceId: wsBId, name: 'Flow B' },
    });
    created.workflowIds.push(wfB.id);

    const sB = await prisma.workflowStatus.create({
      data: { workflowId: wfB.id, workspaceId: wsBId, name: 'Open', category: 'TO_DO', position: 0 },
    });
    statusTodoBId = sB.id;

    // Cross-workflow transition must fail (composite FK)
    await assert.rejects(
      () => prisma.workflowTransition.create({
        data: { workflowId: wfAId, fromStatusId: statusTodoAId, toStatusId: statusTodoBId, name: 'Illegal' },
      }),
    );
  });

  it('5. creates Issues with unique numbering per project', async () => {
    const issue1 = await prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id: projectAId },
        data: { nextIssueNumber: { increment: 1 } },
      });
      return tx.issue.create({
        data: {
          workspaceId: wsAId,
          projectId: projectAId,
          issueNumber: p.nextIssueNumber - 1,
          title: 'First Issue',
          type: 'EPIC',
          statusId: statusTodoAId,
          reporterId: userId,
        },
      });
    });
    issue1Id = issue1.id;
    created.issueIds.push(issue1Id);
    assert.equal(issue1.issueNumber, 1);

    // Duplicate issueNumber in same project must fail
    await assert.rejects(
      () => prisma.issue.create({
        data: {
          workspaceId: wsAId,
          projectId: projectAId,
          issueNumber: 1,
          title: 'Dup Number',
          type: 'TASK',
          statusId: statusTodoAId,
          reporterId: userId,
        },
      }),
    );
  });

  it('6. enforces Issue parent-child hierarchy and prevents cycles & cross-project parents', async () => {
    const issue2 = await prisma.issue.create({
      data: {
        workspaceId: wsAId,
        projectId: projectAId,
        parentId: issue1Id,
        issueNumber: 2,
        title: 'Child Task',
        type: 'TASK',
        statusId: statusTodoAId,
        reporterId: userId,
      },
    });
    issue2Id = issue2.id;
    created.issueIds.push(issue2Id);
    assert.equal(issue2.parentId, issue1Id);

    // Cycle: making issue1's parent = issue2 (while issue2's parent = issue1) must fail
    await assert.rejects(
      () => prisma.issue.update({
        where: { id: issue1Id },
        data: { parentId: issue2Id },
      }),
    );

    // Self-parent must fail
    await assert.rejects(
      () => prisma.issue.update({
        where: { id: issue1Id },
        data: { parentId: issue1Id },
      }),
    );

    // Cross-project parent must fail
    await assert.rejects(
      () => prisma.issue.create({
        data: {
          workspaceId: wsBId,
          projectId: projectBId,
          parentId: issue1Id,
          issueNumber: 1,
          title: 'Cross Project Child',
          type: 'TASK',
          statusId: statusTodoBId,
          reporterId: userId,
        },
      }),
    );
  });

  it('7. validates CustomField typed values and prevents wrong-type or multi-column writes', async () => {
    const numField = await prisma.customField.create({
      data: { workspaceId: wsAId, name: 'Budget', fieldKey: 'budget', type: 'NUMBER' },
    });

    // Valid NUMBER value
    const val = await prisma.issueCustomFieldValue.create({
      data: { issueId: issue1Id, fieldId: numField.id, numberValue: 1500.5 },
    });
    assert.equal(Number(val.numberValue), 1500.5);

    // Wrong column (textValue on NUMBER field) must fail trigger
    await assert.rejects(
      () => prisma.issueCustomFieldValue.create({
        data: { issueId: issue2Id, fieldId: numField.id, textValue: 'wrong' },
      }),
    );

    // Multiple value columns on same row must fail CHECK constraint
    await assert.rejects(
      () => prisma.issueCustomFieldValue.create({
        data: { issueId: issue2Id, fieldId: numField.id, numberValue: 10, booleanValue: true },
      }),
    );
  });

  it('8. prevents cross-tenant relationships via composite foreign keys', async () => {
    const teamB = await prisma.team.create({
      data: { workspaceId: wsBId, name: 'Team B', key: 'TB' },
    });
    created.teamIds.push(teamB.id);

    // Assigning Team from Workspace B to Project in Workspace A must fail
    await assert.rejects(
      () => prisma.project.update({
        where: { id: projectAId },
        data: { teamId: teamB.id },
      }),
    );

    // Creating Issue in Project A (Workspace A) with Status from Workspace B must fail
    await assert.rejects(
      () => prisma.issue.create({
        data: {
          workspaceId: wsAId,
          projectId: projectAId,
          issueNumber: 99,
          title: 'Cross-Tenant Status',
          type: 'BUG',
          statusId: statusTodoBId,
          reporterId: userId,
        },
      }),
    );

    // AuditLog append-only check inside rolled-back transaction (leaves 0 rows)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const logId = randomUUID();
      await client.query(
        `INSERT INTO "audit_logs" ("id", "workspaceId", "actorId", "action", "resourceType") VALUES ($1, $2, $3, 'TEST', 'Issue')`,
        [logId, wsAId, userId],
      );
      await assert.rejects(
        () => client.query(`UPDATE "audit_logs" SET "action" = 'TAMPERED' WHERE "id" = $1`, [logId]),
      );
      await assert.rejects(
        () => client.query(`DELETE FROM "audit_logs" WHERE "id" = $1`, [logId]),
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
