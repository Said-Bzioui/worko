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
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { AuthGuard } from '../../lib/better-auth/auth.guard.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../lib/better-auth/auth.types.js';
import { CurrentUser } from '../../lib/better-auth/current-user.decorator.js';
import { OrgMemberGuard } from '../authz/org-member.guard.js';
import { PermissionGuard } from '../authz/permission.guard.js';
import { PERMISSIONS } from '../authz/rbac.constants.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';
import { WorkspaceMemberGuard } from '../authz/workspace-member.guard.js';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-workspace-member-role.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspacesService } from './workspaces.service.js';

@ApiTags('workspaces')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('organizations/:organizationId/workspaces')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_CREATE)
  @ApiOperation({ summary: 'Create a workspace inside an organization' })
  createInOrganization(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createInOrganization(organizationId, user.id, dto);
  }

  @Get('organizations/:organizationId/workspaces')
  @Version('1')
  @UseGuards(OrgMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ApiOperation({ summary: 'List workspaces accessible to the user in an organization' })
  findAllInOrganization(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.workspacesService.findAllInOrganizationForUser(
      organizationId,
      user.id,
      pagination,
    );
  }

  @Get('workspaces/:workspaceId')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ApiOperation({ summary: 'Get workspace details' })
  findOne(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.workspacesService.findOne(workspaceId);
  }

  @Patch('workspaces/:workspaceId')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ApiOperation({ summary: 'Update workspace settings' })
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/members')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ApiOperation({ summary: 'List workspace members' })
  listMembers(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.workspacesService.listMembers(workspaceId, pagination);
  }

  @Post('workspaces/:workspaceId/members')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Add an organization member to the workspace' })
  addMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(
      workspaceId,
      req.tenantContext!.organizationId!,
      dto,
    );
  }

  @Patch('workspaces/:workspaceId/members/:userId/role')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_ASSIGN_ROLES)
  @ApiOperation({ summary: 'Change a workspace member role' })
  updateMemberRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, userId, dto.roleKey);
  }

  @Delete('workspaces/:workspaceId/members/:userId')
  @Version('1')
  @UseGuards(WorkspaceMemberGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKSPACE_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  removeMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId') userId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, userId);
  }
}
