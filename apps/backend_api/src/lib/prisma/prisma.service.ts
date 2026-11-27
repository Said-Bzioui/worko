/* oxlint-disable typescript/no-unsafe-declaration-merging */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDatabaseClient,
  type DatabaseClient,
  type Pool,
  type PrismaClient,
} from '@said-bzioui/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: DatabaseClient;
  public readonly prisma: PrismaClient;
  public readonly pool: Pool;

  constructor(private readonly config: ConfigService) {
    const databaseUrl =
      this.config.get<string>('DATABASE_URL') ?? process.env['DATABASE_URL'];

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not configured. Please supply DATABASE_URL via environment or ConfigService.',
      );
    }

    // Instantiates exactly one client and pool via the SDK factory
    this.client = createDatabaseClient(databaseUrl);
    this.prisma = this.client.prisma;
    this.pool = this.client.pool;

    // Use Proxy composition so this service acts as PrismaClient without calling super()
    // and without instantiating a redundant second PrismaClient instance.
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return Reflect.get(target.prisma, prop, target.prisma);
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Database connection initialized successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.disconnect();
    this.logger.log('Database connection closed cleanly');
  }
}

export interface PrismaService extends PrismaClient {}
