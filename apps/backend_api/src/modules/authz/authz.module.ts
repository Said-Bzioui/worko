import { Global, Module } from '@nestjs/common';
import { AuthzService } from './authz.service.js';
import { OrgMemberGuard } from './org-member.guard.js';
import { PermissionGuard } from './permission.guard.js';
import { WorkspaceMemberGuard } from './workspace-member.guard.js';

@Global()
@Module({
  providers: [
    AuthzService,
    OrgMemberGuard,
    WorkspaceMemberGuard,
    PermissionGuard,
  ],
  exports: [
    AuthzService,
    OrgMemberGuard,
    WorkspaceMemberGuard,
    PermissionGuard,
  ],
})
export class AuthzModule {}
