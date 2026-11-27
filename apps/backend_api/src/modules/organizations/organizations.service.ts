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
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';
import type { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: AuthzService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.authzService.ensureSystemRbac(tx);

        const orgAdminRole = await tx.role.findUniqueOrThrow({
          where: { key: ROLE_KEYS.ORG_ADMIN },
        });

        const organization = await tx.organization.create({
          data: {
            name: dto.name.trim(),
            slug: dto.slug.trim().toLowerCase(),
          },
        });

        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId,
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        });

        await tx.organizationRoleAssignment.create({
          data: {
            organizationId: organization.id,
            userId,
            roleId: orgAdminRole.id,
          },
        });

        return organization;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Organization slug "${dto.slug}" is already taken`);
      }
      throw error;
    }
  }

  async findAllForUser(userId: string, pagination: PaginationQueryDto) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.OrganizationWhereInput = {
      members: {
        some: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true, workspaces: true },
          },
        },
      }),
      this.prisma.organization.count({ where }),
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

  async findOne(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { members: true, workspaces: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(organizationId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async listMembers(organizationId: string, pagination: PaginationQueryDto) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.OrganizationMemberWhereInput = { organizationId };

    const [members, total, assignments] = await this.prisma.$transaction([
      this.prisma.organizationMember.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { joinedAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      this.prisma.organizationMember.count({ where }),
      this.prisma.organizationRoleAssignment.findMany({
        where: { organizationId },
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

  async assignRole(organizationId: string, targetUserId: string, roleKey: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.authzService.ensureSystemRbac(tx);

      const member = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: targetUserId },
        },
      });
      if (!member || member.status !== MembershipStatus.ACTIVE) {
        throw new NotFoundException('Active organization member not found');
      }

      const role = await tx.role.findUnique({ where: { key: roleKey } });
      if (!role || role.scope !== 'ORGANIZATION') {
        throw new BadRequestException(`Invalid organization role "${roleKey}"`);
      }

      // Prevent demoting the last organization admin
      if (roleKey !== ROLE_KEYS.ORG_ADMIN) {
        const adminCount = await tx.organizationRoleAssignment.count({
          where: {
            organizationId,
            role: { key: ROLE_KEYS.ORG_ADMIN },
            userId: { not: targetUserId },
          },
        });
        if (adminCount === 0) {
          throw new BadRequestException('Cannot demote the last organization admin');
        }
      }

      await tx.organizationRoleAssignment.deleteMany({
        where: { organizationId, userId: targetUserId },
      });

      return tx.organizationRoleAssignment.create({
        data: {
          organizationId,
          userId: targetUserId,
          roleId: role.id,
        },
        include: {
          role: { select: { id: true, key: true, name: true, scope: true } },
        },
      });
    });
  }

  async removeMember(organizationId: string, targetUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: targetUserId },
        },
      });
      if (!member) {
        throw new NotFoundException('Organization member not found');
      }

      const remainingAdmins = await tx.organizationRoleAssignment.count({
        where: {
          organizationId,
          role: { key: ROLE_KEYS.ORG_ADMIN },
          userId: { not: targetUserId },
        },
      });
      if (remainingAdmins === 0) {
        throw new BadRequestException('Cannot remove the last organization admin');
      }

      // Cascade-clean workspace memberships & roles within this organization
      const workspaces = await tx.workspace.findMany({
        where: { organizationId },
        select: { id: true },
      });
      const workspaceIds = workspaces.map((w) => w.id);

      if (workspaceIds.length > 0) {
        await tx.workspaceRoleAssignment.deleteMany({
          where: { workspaceId: { in: workspaceIds }, userId: targetUserId },
        });
        await tx.workspaceMember.deleteMany({
          where: { workspaceId: { in: workspaceIds }, userId: targetUserId },
        });
      }

      await tx.organizationRoleAssignment.deleteMany({
        where: { organizationId, userId: targetUserId },
      });

      await tx.organizationMember.delete({
        where: {
          organizationId_userId: { organizationId, userId: targetUserId },
        },
      });

      return { removed: true, userId: targetUserId };
    });
  }
}
