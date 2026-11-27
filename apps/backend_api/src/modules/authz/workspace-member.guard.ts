import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { AuthenticatedRequest } from '../../lib/better-auth/auth.types.js';
import { AuthzService } from './authz.service.js';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly authzService: AuthzService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const workspaceId = req.params['workspaceId'];
    if (!workspaceId || typeof workspaceId !== 'string' || !isUUID(workspaceId)) {
      throw new BadRequestException('Invalid workspaceId UUID');
    }

    const wsContext = await this.authzService.assertWorkspaceMember(
      user.id,
      workspaceId,
    );

    req.tenantContext = {
      ...req.tenantContext,
      organizationId: wsContext.organizationId,
      workspaceId: wsContext.workspaceId,
    };

    return true;
  }
}
