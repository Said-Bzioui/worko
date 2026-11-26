import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const role = request.headers['x-role'];
    if (!role) {
      throw new UnauthorizedException('Role is missing');
    }
    if (role !== 'admin') {
      throw new UnauthorizedException('Role is invalid');
    }
    return true;
  }
}
