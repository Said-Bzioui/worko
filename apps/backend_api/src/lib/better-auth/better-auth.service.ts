import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BetterAuthService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly auth: any;

  constructor(private readonly prisma: PrismaService) {
    this.auth = betterAuth({
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
      basePath: '/api/v1/auth',
      trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      ],
      database: prismaAdapter(this.prisma, {
        provider: 'postgresql',
      }),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID ?? '',
          clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ?? '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        },
      },
    });
  }
}
