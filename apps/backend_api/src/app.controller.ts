import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check — available on the default version (v1).
   * GET /api/v1/health
   */
  @Get('health')
  @Version('1')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Service is up', schema: { example: { status: 'ok' } } })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
