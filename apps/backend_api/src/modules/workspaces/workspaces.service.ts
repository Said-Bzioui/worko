import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, Prisma } from '@said-bzioui/database';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { AuthzService } from '../authz/authz.service.js';
import { ROLE_KEYS } from '../authz/rbac.constants.js';
import type { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto.js';
import type { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: AuthzService,
  ) {}

  async createInOrganization(
    organizationId: string,
    userId: string,
    dto: CreateWorkspaceDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.authzService.ensureSystemRbac(tx);

        const wsManagerRole = await tx.role.findUniqueOrThrow({
          where: { key: ROLE_KEYS.WS_MANAGER },
        });

        const workspace = await tx.workspace.create({
          data: {
            organizationId,
            name: dto.name.trim(),
            slug: dto.slug.trim().toLowerCase(),
            timezone: dto.timezone?.trim() || 'UTC',
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId,
            status: MembershipStatus.ACTIVE,
          },
        });

        await tx.workspaceRoleAssignment.create({
          data: {
            workspaceId: workspace.id,
            userId,
            roleId: wsManagerRole.id,
          },
        });

        return workspace;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Workspace slug "${dto.slug}" already exists in this organization`,
        );
      }
      throw error;
    }
  }

  async findAllInOrganizationForUser(
    organizationId: string,
    userId: string,
    pagination: PaginationQueryDto,
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.WorkspaceWhereInput = {
      organizationId,
      members: {
        some: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workspace.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true, teams: true, projects: true },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findOne(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { members: true, teams: true, projects: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone.trim() } : {}),
      },
    });
  }

  async listMembers(workspaceId: string, pagination: PaginationQueryDto) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.WorkspaceMemberWhereInput = { workspaceId };

    const [members, total, assignments] = await this.prisma.$transaction([
      this.prisma.workspaceMember.findMany({
        where,
        skip,
        take: pagination.limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      this.prisma.workspaceMember.count({ where }),
      this.prisma.workspaceRoleAssignment.findMany({
        where: { workspaceId },
        include: { role: { select: { id: true, key: true, name: true } } },
      }),
    ]);

    const rolesByUser = new Map<string, Array<{ id: string; key: string; name: string }>>();
    for (const a of assignments) {
      const list = rolesByUser.get(a.userId) ?? [];
      list.push(a.role);
      rolesByUser.set(a.userId, list);
    }

    return {
      items: members.map((m) => ({
        ...m,
        roles: rolesByUser.get(m.userId) ?? [],
      })),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async addMember(
    workspaceId: string,
    organizationId: string,
    dto: AddWorkspaceMemberDto,
  ) {
    const roleKey = dto.roleKey ?? ROLE_KEYS.WS_MEMBER;

    return this.prisma.$transaction(async (tx) => {
      await this.authzService.ensureSystemRbac(tx);

      // User must already be an ACTIVE member of the parent Organization
      const orgMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: dto.userId },
        },
      });
      if (!orgMember || orgMember.status !== MembershipStatus.ACTIVE) {
        throw new BadRequestException(
          'User must be an active member of the parent organization first',
        );
      }

      const role = await tx.role.findUnique({ where: { key: roleKey } });
      if (!role || role.scope !== 'WORKSPACE') {
        throw new BadRequestException(`Invalid workspace role "${roleKey}"`);
      }

      const member = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId, userId: dto.userId },
        },
        update: { status: MembershipStatus.ACTIVE },
        create: {
          workspaceId,
          userId: dto.userId,
          status: MembershipStatus.ACTIVE,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      await tx.workspaceRoleAssignment.deleteMany({
        where: { workspaceId, userId: dto.userId },
      });

      await tx.workspaceRoleAssignment.create({
        data: {
          workspaceId,
          userId: dto.userId,
          roleId: role.id,
        },
      });

      return { ...member, role: { id: role.id, key: role.key, name: role.name } };
    });
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    roleKey: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.authzService.ensureSystemRbac(tx);

      const member = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: targetUserId },
        },
      });
      if (!member || member.status !== MembershipStatus.ACTIVE) {
        throw new NotFoundException('Active workspace member not found');
      }

      const role = await tx.role.findUnique({ where: { key: roleKey } });
      if (!role || role.scope !== 'WORKSPACE') {
        throw new BadRequestException(`Invalid workspace role "${roleKey}"`);
      }

      await tx.workspaceRoleAssignment.deleteMany({
        where: { workspaceId, userId: targetUserId },
      });

      return tx.workspaceRoleAssignment.create({
        data: {
          workspaceId,
          userId: targetUserId,
          roleId: role.id,
        },
        include: {
          role: { select: { id: true, key: true, name: true, scope: true } },
        },
      });
    });
  }

  async removeMember(workspaceId: string, targetUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: targetUserId },
        },
      });
      if (!member) {
        throw new NotFoundException('Workspace member not found');
      }

      await tx.workspaceRoleAssignment.deleteMany({
        where: { workspaceId, userId: targetUserId },
      });

      await tx.workspaceMember.delete({
        where: {
          workspaceId_userId: { workspaceId, userId: targetUserId },
        },
      });

      return { removed: true, userId: targetUserId };
    });
  }
}
