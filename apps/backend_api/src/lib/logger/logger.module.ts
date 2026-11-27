import { Global, Module } from '@nestjs/common';
import { WorkoLoggerService } from './worko-logger.service.js';

@Global()
@Module({
  providers: [WorkoLoggerService],
  exports: [WorkoLoggerService],
})
export class LoggerModule {}
