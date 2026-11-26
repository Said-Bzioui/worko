import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UserLogger } from './user.logger.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserLogger],
  exports: [UsersService, UserLogger],
})
export class UsersModule {}
