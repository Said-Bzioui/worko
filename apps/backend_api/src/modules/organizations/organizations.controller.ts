import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { AuthGuard } from '../../lib/better-auth/auth.guard.js';
import type { AuthenticatedUser } from '../../lib/better-auth/auth.types.js';
import { CurrentUser } from '../../lib/better-auth/current-user.decorator.js';
import { OrgMemberGuard } from '../authz/org-member.guard.js';
import { PermissionGuard } from '../authz/permission.guard.js';
import { PERMISSIONS } from '../authz/rbac.constants.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';
import { AssignOrganizationRoleDto } from './dto/assign-organization-role.dto.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationsService } from './organizations.service.js';

@ApiTags('organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new organization' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List organizations accessible to the current user' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.organizationsService.findAllForUser(user.id, pagination);
  }

  @Get(':organizationId')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_READ)
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.organizationsService.findOne(organizationId);
  }

  @Patch(':organizationId')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Update organization settings' })
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(organizationId, dto);
  }

  @Get(':organizationId/members')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_READ)
  @ApiOperation({ summary: 'List organization members' })
  listMembers(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.organizationsService.listMembers(organizationId, pagination);
  }

  @Patch(':organizationId/members/:userId/role')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_ASSIGN_ROLES)
  @ApiOperation({ summary: 'Assign a role to an organization member' })
  assignRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignOrganizationRoleDto,
  ) {
    return this.organizationsService.assignRole(organizationId, userId, dto.roleKey);
  }

  @Delete(':organizationId/members/:userId')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  removeMember(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeMember(organizationId, userId);
  }
}
