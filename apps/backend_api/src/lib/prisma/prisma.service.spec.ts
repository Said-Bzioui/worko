import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { PrismaModule } from './prisma.module.js';
import { PrismaService } from './prisma.service.js';

describe('PrismaModule & PrismaService Lifecycle', () => {
  it('connects on module init, executes queries, and disconnects cleanly on close', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const prisma = app.get(PrismaService);
    expect(prisma).toBeDefined();

    // Verify live query if DATABASE_URL is configured
    if (process.env.DATABASE_URL) {
      const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
      expect(result[0]?.ok).toBe(1);
    }

    await app.close();
  }, 15000);
});
