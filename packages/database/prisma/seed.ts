import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import {
  BoardType,
  IssuePriority,
  IssueType,
  MembershipStatus,
  OrganizationStatus,
  PrismaClient,
  ProjectStatus,
  RoleScope,
  StatusCategory,
  createPrismaClient,
} from '../src/index.js';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function seedDevelopmentDatabase(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping development seed: NODE_ENV is production.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Demo Users (never overwrite existing password/name if already present)
    const demoPassword = hashPassword('WorkoDemo123!');

    const admin = await tx.user.upsert({
      where: { email: 'admin@worko.dev' },
      update: {},
      create: {
        id: randomUUID(),
        name: 'Worko Admin',
        email: 'admin@worko.dev',
        password: demoPassword,
        emailVerified: true,
      },
    });

    const lead = await tx.user.upsert({
      where: { email: 'lead@worko.dev' },
      update: {},
      create: {
        id: randomUUID(),
        name: 'Sarah Lead',
        email: 'lead@worko.dev',
        password: demoPassword,
        emailVerified: true,
      },
    });

    const dev = await tx.user.upsert({
      where: { email: 'dev@worko.dev' },
      update: {},
      create: {
        id: randomUUID(),
        name: 'Alex Developer',
        email: 'dev@worko.dev',
        password: demoPassword,
        emailVerified: true,
      },
    });

    const pm = await tx.user.upsert({
      where: { email: 'pm@worko.dev' },
      update: {},
      create: {
        id: randomUUID(),
        name: 'Maya Product',
        email: 'pm@worko.dev',
        password: demoPassword,
        emailVerified: true,
      },
    });

    // 2. System RBAC Roles
    const orgAdminRole = await tx.role.upsert({
      where: { key: 'org_admin' },
      update: {},
      create: {
        name: 'Organization Admin',
        key: 'org_admin',
        scope: RoleScope.ORGANIZATION,
        description: 'Full administrative access across the organization',
        isSystem: true,
      },
    });

    await tx.role.upsert({
      where: { key: 'ws_manager' },
      update: {},
      create: {
        name: 'Workspace Manager',
        key: 'ws_manager',
        scope: RoleScope.WORKSPACE,
        description: 'Manage teams, projects, and workflows in a workspace',
        isSystem: true,
      },
    });

    // 3. One Demo Organization
    const org = await tx.organization.upsert({
      where: { slug: 'worko-demo' },
      update: {},
      create: {
        name: 'Worko Demo Organization',
        slug: 'worko-demo',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 4. Organization Admin & Members
    for (const user of [admin, lead, dev, pm]) {
      await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
        update: {},
        create: {
          organizationId: org.id,
          userId: user.id,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });
    }

    await tx.organizationRoleAssignment.upsert({
      where: {
        organizationId_userId_roleId: {
          organizationId: org.id,
          userId: admin.id,
          roleId: orgAdminRole.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: admin.id,
        roleId: orgAdminRole.id,
      },
    });

    // 5. One Workspace
    const workspace = await tx.workspace.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: 'main' } },
      update: {},
      create: {
        organizationId: org.id,
        name: 'Worko Main Workspace',
        slug: 'main',
        timezone: 'UTC',
      },
    });

    // 6. Workspace Members
    for (const user of [admin, lead, dev, pm]) {
      await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
        update: {},
        create: {
          workspaceId: workspace.id,
          userId: user.id,
          status: MembershipStatus.ACTIVE,
        },
      });
    }

    // 7. Two Teams (Engineering & Product)
    const engineeringTeam = await tx.team.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key: 'ENG' } },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: 'Engineering',
        key: 'ENG',
        description: 'Core platform and product engineering team',
      },
    });

    const productTeam = await tx.team.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key: 'PROD' } },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: 'Product',
        key: 'PROD',
        description: 'Product strategy, roadmap, and design',
      },
    });

    for (const [teamId, userId, role] of [
      [engineeringTeam.id, lead.id, 'LEAD'],
      [engineeringTeam.id, dev.id, 'MEMBER'],
      [productTeam.id, pm.id, 'LEAD'],
      [productTeam.id, admin.id, 'MEMBER'],
    ] as const) {
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId, userId } },
        update: {},
        create: { teamId, userId, role },
      });
    }

    // 8. Default Software Development Workflow
    let workflow = await tx.workflow.findFirst({
      where: { workspaceId: workspace.id, name: 'Software Development Workflow' },
    });
    if (!workflow) {
      workflow = await tx.workflow.create({
        data: {
          workspaceId: workspace.id,
          name: 'Software Development Workflow',
          description: 'Default 5-stage software delivery workflow',
          isDefault: true,
        },
      });
    }

    // 9. Workflow Statuses: Backlog, To Do, In Progress, In Review, Done
    const statusDefs = [
      { name: 'Backlog', category: StatusCategory.TO_DO, color: '#64748b', position: 0 },
      { name: 'To Do', category: StatusCategory.TO_DO, color: '#3b82f6', position: 1 },
      { name: 'In Progress', category: StatusCategory.IN_PROGRESS, color: '#f59e0b', position: 2 },
      { name: 'In Review', category: StatusCategory.IN_PROGRESS, color: '#8b5cf6', position: 3 },
      { name: 'Done', category: StatusCategory.DONE, color: '#10b981', position: 4 },
    ] as const;

    const statusMap = new Map<string, string>();
    for (const s of statusDefs) {
      const status = await tx.workflowStatus.upsert({
        where: { workflowId_name: { workflowId: workflow.id, name: s.name } },
        update: {},
        create: {
          workflowId: workflow.id,
          workspaceId: workspace.id,
          name: s.name,
          category: s.category,
          color: s.color,
          position: s.position,
        },
      });
      statusMap.set(s.name, status.id);
    }

    const transitions = [
      ['Backlog', 'To Do', 'Move to To Do'],
      ['To Do', 'In Progress', 'Start Progress'],
      ['In Progress', 'In Review', 'Submit for Review'],
      ['In Review', 'Done', 'Approve & Complete'],
      ['In Review', 'In Progress', 'Request Changes'],
    ] as const;

    for (const [fromName, toName, name] of transitions) {
      const fromStatusId = statusMap.get(fromName)!;
      const toStatusId = statusMap.get(toName)!;
      const existing = await tx.workflowTransition.findFirst({
        where: { workflowId: workflow.id, fromStatusId, toStatusId },
      });
      if (!existing) {
        await tx.workflowTransition.create({
          data: { workflowId: workflow.id, fromStatusId, toStatusId, name },
        });
      }
    }

    // 10. One Project with key WORKO
    let project = await tx.project.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key: 'WORKO' } },
      update: {},
      create: {
        workspaceId: workspace.id,
        teamId: engineeringTeam.id,
        name: 'Worko Platform',
        key: 'WORKO',
        description: 'Flagship demo project for WORKO platform',
        status: ProjectStatus.ACTIVE,
        nextIssueNumber: 5,
      },
    });

    if (project.nextIssueNumber < 5) {
      project = await tx.project.update({
        where: { id: project.id },
        data: { nextIssueNumber: 5 },
      });
    }

    // 11. Project Members
    for (const user of [admin, lead, dev, pm]) {
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
        update: {},
        create: { projectId: project.id, userId: user.id },
      });
    }

    // 12. Default Kanban & Scrum Boards
    const ensureBoard = async (
      name: string,
      type: BoardType,
      columns: readonly string[],
    ) => {
      const existing = await tx.board.findFirst({
        where: { projectId: project.id, name },
      });
      if (existing) return existing;

      return tx.board.create({
        data: {
          projectId: project.id,
          name,
          type,
          columns: {
            create: columns.map((colName, idx) => ({
              name: colName,
              statusId: statusMap.get(colName)!,
              position: idx,
            })),
          },
        },
      });
    };

    await ensureBoard('WORKO Kanban Board', BoardType.KANBAN, [
      'Backlog',
      'To Do',
      'In Progress',
      'In Review',
      'Done',
    ]);
    await ensureBoard('WORKO Scrum Board', BoardType.SCRUM, [
      'To Do',
      'In Progress',
      'In Review',
      'Done',
    ]);

    // 13. Sample Epic, Story, Task, and Subtask
    const epic = await tx.issue.upsert({
      where: { projectId_issueNumber: { projectId: project.id, issueNumber: 1 } },
      update: {},
      create: {
        workspaceId: workspace.id,
        projectId: project.id,
        issueNumber: 1,
        title: 'Core Platform Foundation',
        type: IssueType.EPIC,
        priority: IssuePriority.HIGH,
        statusId: statusMap.get('To Do')!,
        reporterId: admin.id,
        assigneeId: lead.id,
        position: 1000,
      },
    });

    const story = await tx.issue.upsert({
      where: { projectId_issueNumber: { projectId: project.id, issueNumber: 2 } },
      update: {},
      create: {
        workspaceId: workspace.id,
        projectId: project.id,
        parentId: epic.id,
        issueNumber: 2,
        title: 'User Authentication & Workspace Onboarding',
        type: IssueType.STORY,
        priority: IssuePriority.HIGH,
        statusId: statusMap.get('In Progress')!,
        reporterId: pm.id,
        assigneeId: dev.id,
        storyPoints: 5,
        position: 2000,
      },
    });

    const task = await tx.issue.upsert({
      where: { projectId_issueNumber: { projectId: project.id, issueNumber: 3 } },
      update: {},
      create: {
        workspaceId: workspace.id,
        projectId: project.id,
        parentId: story.id,
        issueNumber: 3,
        title: 'Configure Better Auth session cookies',
        type: IssueType.TASK,
        priority: IssuePriority.MEDIUM,
        statusId: statusMap.get('In Review')!,
        reporterId: lead.id,
        assigneeId: dev.id,
        storyPoints: 2,
        position: 3000,
      },
    });

    await tx.issue.upsert({
      where: { projectId_issueNumber: { projectId: project.id, issueNumber: 4 } },
      update: {},
      create: {
        workspaceId: workspace.id,
        projectId: project.id,
        parentId: task.id,
        issueNumber: 4,
        title: 'Verify Origin CSRF trustedOrigins header',
        type: IssueType.SUBTASK,
        priority: IssuePriority.MEDIUM,
        statusId: statusMap.get('Done')!,
        reporterId: dev.id,
        assigneeId: dev.id,
        storyPoints: 1,
        position: 4000,
      },
    });
  }, { timeout: 30000 });
}

// Run when executed directly via `tsx prisma/seed.ts`
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  seedDevelopmentDatabase(prisma)
    .then(() => {
      console.log('Development seed completed successfully.');
    })
    .catch((err) => {
      console.error('Development seed failed:', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
