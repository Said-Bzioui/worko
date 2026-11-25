export * from './generated/prisma/client.js';
export { PrismaPg } from '@prisma/adapter-pg';
export { Pool } from 'pg';

import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
