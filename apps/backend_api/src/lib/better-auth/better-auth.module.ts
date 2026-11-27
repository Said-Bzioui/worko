import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { BetterAuthService } from './better-auth.service.js';

@Global()
@Module({
  providers: [BetterAuthService, AuthGuard],
  exports: [BetterAuthService, AuthGuard],
})
export class BetterAuthModule {}
