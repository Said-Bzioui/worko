export * from './generated/prisma/client.js';
export { PrismaPg } from '@prisma/adapter-pg';
export { Pool, type PoolConfig } from 'pg';

export {
  createDatabaseClient,
  createPrismaClient,
  type DatabaseClient,
  type DatabaseClientOptions,
} from './client.js';
