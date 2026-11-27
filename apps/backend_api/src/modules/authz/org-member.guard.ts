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
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly authzService: AuthzService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizationId = req.params['organizationId'];
    if (!organizationId || typeof organizationId !== 'string' || !isUUID(organizationId)) {
      throw new BadRequestException('Invalid organizationId UUID');
    }

    await this.authzService.assertOrganizationMember(user.id, organizationId);
    req.tenantContext = {
      ...req.tenantContext,
      organizationId,
    };

    return true;
  }
}
