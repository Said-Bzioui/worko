import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BetterAuthModule } from '../../lib/better-auth/better-auth.module.js';
import { BetterAuthService } from '../../lib/better-auth/better-auth.service.js';
import { PrismaModule } from '../../lib/prisma/prisma.module.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { TransformInterceptor } from '../../utils/transform.interceptor.js';
import { AuthzModule } from '../authz/authz.module.js';
import { ROLE_KEYS } from '../authz/rbac.constants.js';
import { OrganizationsModule } from './organizations.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

describe('DB-04 Identity, Organizations, Workspaces & Authorization (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now().toString(36);
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];

  let userA: { id: string; email: string; name: string };
  let userB: { id: string; email: string; name: string };
  let userC: { id: string; email: string; name: string };

  let orgAId: string;
  let orgBId: string;
  let wsAId: string;

  beforeAll(async () => {
    const usersById = new Map<string, { id: string; email: string; name: string }>();

    const mockBetterAuthService = {
      auth: {
        api: {
          getSession: async ({ headers }: { headers: Headers }) => {
            const testUserId = headers.get('x-test-user-id');
            if (!testUserId) return null;
            const u = usersById.get(testUserId);
            if (!u) return null;
            return {
              user: { ...u, image: null, emailVerified: true },
              session: {
                id: `sess-${testUserId}`,
                expiresAt: new Date(Date.now() + 3600_000),
              },
            };
          },
        },
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        BetterAuthModule,
        AuthzModule,
        OrganizationsModule,
        WorkspacesModule,
      ],
    })
      .overrideProvider(BetterAuthService)
      .useValue(mockBetterAuthService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalInterceptors(new TransformInterceptor<unknown>());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    userA = await prisma.user.create({
      data: { id: randomUUID(), name: 'User A', email: `usera-${runId}@worko.test` },
      select: { id: true, email: true, name: true },
    });
    userB = await prisma.user.create({
      data: { id: randomUUID(), name: 'User B', email: `userb-${runId}@worko.test` },
      select: { id: true, email: true, name: true },
    });
    userC = await prisma.user.create({
      data: { id: randomUUID(), name: 'User C', email: `userc-${runId}@worko.test` },
      select: { id: true, email: true, name: true },
    });

    for (const u of [userA, userB, userC]) {
      usersById.set(u.id, u);
      createdUserIds.push(u.id);
    }
  }, 30_000);

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } finally {
      await app?.close();
    }
  }, 30_000);

  it('1. rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/organizations').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .send({ name: 'Unauth Org', slug: 'unauth-org' })
      .expect(401);
  });

  it('2 & 3. authenticated user creates organization and receives org_admin role', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('x-test-user-id', userA.id)
      .send({ name: 'Tenant Alpha', slug: `tenant-alpha-${runId}` })
      .expect(201);

    orgAId = res.body.data.id;
    createdOrgIds.push(orgAId);
    expect(res.body.data.slug).toBe(`tenant-alpha-${runId}`);

    const assignments = await prisma.organizationRoleAssignment.findMany({
      where: { organizationId: orgAId, userId: userA.id },
      include: { role: true },
    });
    expect(assignments.some((a) => a.role.key === ROLE_KEYS.ORG_ADMIN)).toBe(true);
  });

  it('4. prevents user from accessing another organization', async () => {
    const resB = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('x-test-user-id', userB.id)
      .send({ name: 'Tenant Beta', slug: `tenant-beta-${runId}` })
      .expect(201);

    orgBId = resB.body.data.id;
    createdOrgIds.push(orgBId);

    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgBId}`)
      .set('x-test-user-id', userA.id)
      .expect(403);
  });

  it('5 & 6. requires valid org membership to create workspace and blocks unauthorized workspace access', async () => {
    // User B is NOT a member of orgA -> cannot create workspace in orgA
    await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/workspaces`)
      .set('x-test-user-id', userB.id)
      .send({ name: 'Illegal WS', slug: 'illegal-ws' })
      .expect(403);

    // User A creates workspace in orgA
    const wsRes = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/workspaces`)
      .set('x-test-user-id', userA.id)
      .send({ name: 'Engineering WS', slug: 'eng-ws' })
      .expect(201);

    wsAId = wsRes.body.data.id;

    // User B cannot access wsA
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${wsAId}`)
      .set('x-test-user-id', userB.id)
      .expect(403);
  });

  it('7, 8 & 9. enforces RBAC permissions for org updates, workspace members, and role assignments', async () => {
    // Add userC as ACTIVE orgA member with org_member role (read-only)
    const orgMemberRole = await prisma.role.findUniqueOrThrow({
      where: { key: ROLE_KEYS.ORG_MEMBER },
    });
    await prisma.organizationMember.create({
      data: { organizationId: orgAId, userId: userC.id, status: 'ACTIVE', joinedAt: new Date() },
    });
    await prisma.organizationRoleAssignment.create({
      data: { organizationId: orgAId, userId: userC.id, roleId: orgMemberRole.id },
    });

    // UserC (org_member) CAN read orgA
    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgAId}`)
      .set('x-test-user-id', userC.id)
      .expect(200);

    // UserC (org_member) CANNOT update orgA settings
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .set('x-test-user-id', userC.id)
      .send({ name: 'Hacked Org' })
      .expect(403);

    // UserA (org_admin) adds userC to wsA as ws_member
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${wsAId}/members`)
      .set('x-test-user-id', userA.id)
      .send({ userId: userC.id, roleKey: ROLE_KEYS.WS_MEMBER })
      .expect(201);

    // UserC (ws_member) CANNOT add members to wsA
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${wsAId}/members`)
      .set('x-test-user-id', userC.id)
      .send({ userId: userB.id, roleKey: ROLE_KEYS.WS_MEMBER })
      .expect(403);

    // UserA promotes userC to ws_manager in wsA
    const roleRes = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${wsAId}/members/${userC.id}/role`)
      .set('x-test-user-id', userA.id)
      .send({ roleKey: ROLE_KEYS.WS_MANAGER })
      .expect(200);
    expect(roleRes.body.data.role.key).toBe(ROLE_KEYS.WS_MANAGER);

    // UserC (now ws_manager) STILL cannot add userB (not in orgA) -> 400
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${wsAId}/members`)
      .set('x-test-user-id', userC.id)
      .send({ userId: userB.id, roleKey: ROLE_KEYS.WS_MEMBER })
      .expect(400);
  }, 15000);

  it('10. rejects cross-tenant access and exposes no sensitive user fields', async () => {
    const membersRes = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgAId}/members`)
      .set('x-test-user-id', userA.id)
      .expect(200);

    for (const m of membersRes.body.data.items) {
      expect(m.user.password).toBeUndefined();
    }

    // UserA cannot list members of orgB
    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgBId}/members`)
      .set('x-test-user-id', userA.id)
      .expect(403);
  });
});
