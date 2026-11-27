import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { AppModule, ObserveInstrument } from './app.module.js';
import { BetterAuthService } from './lib/better-auth/better-auth.service.js';
import { TransformInterceptor } from './utils/transform.interceptor.js';
import { WorkoLoggerService } from './lib/logger/worko-logger.service.js';
import { printBanner } from './lib/logger/banner.js';

async function bootstrap() {
  // ── Create app with no built-in logger (we replace it below) ──────────────
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
    bodyParser: false,
    logger: false,
  });

  // ── 1. Plug WorkoLogger into NestJS (startup messages + exceptions) ────────
  const logger = app.get(WorkoLoggerService);
  app.useLogger(logger);

  // ── 2. CORS ──────────────────────────────────────────────────────────────
  const env = process.env.NODE_ENV ?? 'development';
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Postman, curl, server-to-server) with no Origin header
      if (!origin) return callback(null, true);
      if (configuredOrigins.includes(origin)) return callback(null, true);
      if (env !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── 3. Better Auth (must be before body-parser) ───────────────────────────
  const betterAuthService = app.get(BetterAuthService);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/v1/auth/{*any}', toNodeHandler(betterAuthService.auth));

  // ── 3. Body parsing ───────────────────────────────────────────────────────
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });

  // ── 4. Global prefix + URI versioning ─────────────────────────────────────
  app.setGlobalPrefix('api', {
    exclude: ['/api/v1/auth/{*any}'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // ── 5. Global pipes & interceptors ────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor<unknown>());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // ── 7. Swagger — dev only (never expose schema in production) ─────────────
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Worko API')
      .setDescription('Worko REST API — versioned at /api/v{n}/')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addServer(`http://localhost:${process.env.PORT ?? 8080}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log('Swagger docs available at /docs', 'Bootstrap');
  }

  // ── 7. Listen ─────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 8080;
  await app.listen(port);

  logger.log(`Application started on port ${port}`, 'Bootstrap');
  printBanner(port, env);
}

await bootstrap();
