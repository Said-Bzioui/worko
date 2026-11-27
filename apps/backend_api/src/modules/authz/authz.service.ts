import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { MembershipStatus, Prisma } from '@said-bzioui/database';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import {
  PERMISSION_DEFINITIONS,
  type PermissionKey,
  SYSTEM_ROLE_DEFINITIONS,
} from './rbac.constants.js';

@Injectable()
export class AuthzService implements OnModuleInit {
  private rbacBootstrapped = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemRbac();
  }

  /**
   * Idempotently ensures system Roles, Permissions, and RolePermissions exist.
   * Safe to run in both seeded dev DBs and fresh test DBs.
   */
  async ensureSystemRbac(tx?: Prisma.TransactionClient): Promise<void> {
    if (this.rbacBootstrapped) return;

    const db = tx ?? this.prisma;

    await db.permission.createMany({
      data: PERMISSION_DEFINITIONS.map((def) => ({
        key: def.key,
        resource: def.resource,
        action: def.action,
        description: def.description,
      })),
      skipDuplicates: true,
    });

    const permissions = await db.permission.findMany({
      where: { key: { in: PERMISSION_DEFINITIONS.map((d) => d.key) } },
      select: { id: true, key: true },
    });
    const permissionMap = new Map(permissions.map((p) => [p.key, p.id]));

    await db.role.createMany({
      data: SYSTEM_ROLE_DEFINITIONS.map((roleDef) => ({
        key: roleDef.key,
        name: roleDef.name,
        scope: roleDef.scope,
        description: roleDef.description,
        isSystem: true,
      })),
      skipDuplicates: true,
    });

    const roles = await db.role.findMany({
      where: { key: { in: SYSTEM_ROLE_DEFINITIONS.map((r) => r.key) } },
      select: { id: true, key: true },
    });
    const roleMap = new Map(roles.map((r) => [r.key, r.id]));

    const rolePermRows: { roleId: string; permissionId: string }[] = [];
    for (const roleDef of SYSTEM_ROLE_DEFINITIONS) {
      const roleId = roleMap.get(roleDef.key);
      if (!roleId) continue;
      for (const permKey of roleDef.permissions) {
        const permissionId = permissionMap.get(permKey);
        if (permissionId) {
          rolePermRows.push({ roleId, permissionId });
        }
      }
    }

    if (rolePermRows.length > 0) {
      await db.rolePermission.createMany({
        data: rolePermRows,
        skipDuplicates: true,
      });
    }

    if (!tx) {
      this.rbacBootstrapped = true;
    }
  }

  async assertOrganizationMember(userId: string, organizationId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member || member.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    return member;
  }

  async assertWorkspaceMember(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, organizationId: true },
    });

    if (!workspace) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Must be an active member of both the parent Organization and the Workspace
    await this.assertOrganizationMember(userId, workspace.organizationId);

    const wsMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!wsMember || wsMember.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return {
      workspaceId: workspace.id,
      organizationId: workspace.organizationId,
      member: wsMember,
    };
  }

  async getOrganizationPermissions(
    userId: string,
    organizationId: string,
  ): Promise<Set<string>> {
    const assignments = await this.prisma.organizationRoleAssignment.findMany({
      where: { organizationId, userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const keys = new Set<string>();
    for (const a of assignments) {
      for (const rp of a.role.permissions) {
        keys.add(rp.permission.key);
      }
    }
    return keys;
  }

  async getWorkspacePermissions(
    userId: string,
    workspaceId: string,
    organizationId: string,
  ): Promise<Set<string>> {
    const [wsAssignments, orgKeys] = await Promise.all([
      this.prisma.workspaceRoleAssignment.findMany({
        where: { workspaceId, userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      }),
      this.getOrganizationPermissions(userId, organizationId),
    ]);

    const keys = new Set<string>(orgKeys);
    for (const a of wsAssignments) {
      for (const rp of a.role.permissions) {
        keys.add(rp.permission.key);
      }
    }
    return keys;
  }

  async hasPermissions(
    userId: string,
    required: readonly PermissionKey[],
    scope: { organizationId?: string; workspaceId?: string },
  ): Promise<boolean> {
    if (required.length === 0) return true;

    let granted: Set<string>;
    if (scope.workspaceId) {
      const wsContext = await this.assertWorkspaceMember(userId, scope.workspaceId);
      granted = await this.getWorkspacePermissions(
        userId,
        scope.workspaceId,
        wsContext.organizationId,
      );
    } else if (scope.organizationId) {
      await this.assertOrganizationMember(userId, scope.organizationId);
      granted = await this.getOrganizationPermissions(userId, scope.organizationId);
    } else {
      return false;
    }

    return required.every((perm) => granted.has(perm));
  }
}
