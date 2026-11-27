import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../lib/better-auth/auth.types.js';
import { AuthzService } from './authz.service.js';
import type { PermissionKey } from './rbac.constants.js';
import { PERMISSIONS_KEY } from './require-permissions.decorator.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authzService: AuthzService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const workspaceId =
      req.tenantContext?.workspaceId ??
      (typeof req.params['workspaceId'] === 'string'
        ? req.params['workspaceId']
        : undefined);

    const organizationId =
      req.tenantContext?.organizationId ??
      (typeof req.params['organizationId'] === 'string'
        ? req.params['organizationId']
        : undefined);

    const allowed = await this.authzService.hasPermissions(user.id, required, {
      workspaceId,
      organizationId,
    });

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
