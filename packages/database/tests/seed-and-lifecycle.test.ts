import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPrismaClient } from '../src/index.js';
import { seedDevelopmentDatabase } from '../prisma/seed.js';

const prisma = createPrismaClient(process.env.DATABASE_URL);

after(async () => {
  await prisma.$disconnect();
});

describe('WORKO Development Seed & Retrieval', () => {
  it('1. runs seedDevelopmentDatabase idempotently without duplicating records', async () => {
    await seedDevelopmentDatabase(prisma);
    await seedDevelopmentDatabase(prisma);

    const orgs = await prisma.organization.findMany({ where: { slug: 'worko-demo' } });
    assert.equal(orgs.length, 1);

    const workspaces = await prisma.workspace.findMany({
      where: { organizationId: orgs[0]!.id, slug: 'main' },
    });
    assert.equal(workspaces.length, 1);

    const teams = await prisma.team.findMany({ where: { workspaceId: workspaces[0]!.id } });
    assert.equal(teams.length, 2);

    const projects = await prisma.project.findMany({
      where: { workspaceId: workspaces[0]!.id, key: 'WORKO' },
    });
    assert.equal(projects.length, 1);

    const boards = await prisma.board.findMany({ where: { projectId: projects[0]!.id } });
    assert.equal(boards.length, 2);

    const issues = await prisma.issue.findMany({ where: { projectId: projects[0]!.id } });
    assert.equal(issues.length, 4);
  });

  it('2. retrieves Organization, Workspace, Teams, and Project WORKO with relations', async () => {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'worko-demo' },
      include: {
        workspaces: {
          include: {
            teams: true,
            projects: { include: { boards: { include: { columns: true } } } },
            workflows: { include: { statuses: { orderBy: { position: 'asc' } } } },
          },
        },
      },
    });

    assert.equal(org.workspaces.length, 1);
    const ws = org.workspaces[0]!;
    assert.equal(ws.teams.map((t) => t.key).sort().join(','), 'ENG,PROD');
    assert.equal(ws.projects[0]?.key, 'WORKO');
    assert.equal(ws.workflows[0]?.statuses.map((s) => s.name).join(','), 'Backlog,To Do,In Progress,In Review,Done');
  });

  it('3. retrieves Epic -> Story -> Task -> Subtask hierarchy for WORKO', async () => {
    const project = await prisma.project.findFirstOrThrow({ where: { key: 'WORKO' } });
    const issues = await prisma.issue.findMany({
      where: { projectId: project.id },
      orderBy: { issueNumber: 'asc' },
    });

    assert.equal(issues.map((i) => i.type).join(','), 'EPIC,STORY,TASK,SUBTASK');
    const [epic, story, task, subtask] = issues;
    assert.equal(story!.parentId, epic!.id);
    assert.equal(task!.parentId, story!.id);
    assert.equal(subtask!.parentId, task!.id);
  });

  it('4. rolls back Prisma transaction on failure without persisting partial writes', async () => {
    const uniqueSlug = `rollback-test-${Date.now()}`;

    await assert.rejects(
      () =>
        prisma.$transaction(async (tx) => {
          await tx.organization.create({
            data: { name: 'Rollback Org', slug: uniqueSlug },
          });
          throw new Error('Intentional rollback');
        }),
    );

    const found = await prisma.organization.findUnique({ where: { slug: uniqueSlug } });
    assert.equal(found, null);
  });
});
