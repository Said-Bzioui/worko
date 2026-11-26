import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { AppModule, ObserveInstrument } from './app.module.js';
import { BetterAuthService } from './lib/better-auth/better-auth.service.js';
import { TransformInterceptor } from './utils/transform.interceptor.js';



async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
    // Disable body parser so Better Auth can read the raw request body before
    // it is consumed. Re-enabled below for all non-auth routes.
    bodyParser: false,
  });

  // ── 1. Better Auth handler (must be before body parser) ────────────────────
  const betterAuthService = app.get(BetterAuthService);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/v1/auth/{*any}', toNodeHandler(betterAuthService.auth));

  // ── 2. Body parsing for all other routes ───────────────────────────────────
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });

  // ── 3. Global API prefix + URI versioning ──────────────────────────────────
  // Routes become: /api/v1/<controller-path>
  // Better Auth stays at /api/auth/* (exempt from prefix)
  app.setGlobalPrefix('api', {
    exclude: ['/api/v1/auth/{*any}'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // ── 4. Swagger at /docs ────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Worko API')
    .setDescription('Worko REST API — versioned at /api/v{n}/')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Local')
    .build();
  // ── 5. Global transform interceptor ────────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor<any>());
  // ── 6. Global validation pipes ────────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ transform: true }));


  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
