import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { BetterAuthService } from './better-auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = fromNodeHeaders(request.headers);

    const result = await this.betterAuthService.auth.api.getSession({
      headers,
    });

    if (!result?.user || !result?.session) {
      throw new UnauthorizedException('Authentication required');
    }

    // Expose only safe identity fields (never password, token, or secrets)
    request.user = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      image: result.user.image ?? null,
      emailVerified: Boolean(result.user.emailVerified),
    };

    request.session = {
      id: result.session.id,
      expiresAt: new Date(result.session.expiresAt),
    };

    return true;
  }
}
