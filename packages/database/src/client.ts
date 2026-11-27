import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export interface DatabaseClientOptions {
  poolConfig?: Omit<PoolConfig, 'connectionString'>;
}

export interface DatabaseClient {
  prisma: PrismaClient;
  pool: Pool;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Pure Database SDK factory.
 *
 * Instantiates exactly one Pool and one PrismaClient instance configured with the pg adapter.
 * Does not read process.env or load .env files — the consumer must supply databaseUrl explicitly.
 */
export function createDatabaseClient(
  databaseUrl: string,
  options?: DatabaseClientOptions,
): DatabaseClient {
  if (!databaseUrl || typeof databaseUrl !== 'string') {
    throw new Error('createDatabaseClient requires a valid databaseUrl string');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ...options?.poolConfig,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return {
    prisma,
    pool,
    async connect(): Promise<void> {
      await prisma.$connect();
    },
    async disconnect(): Promise<void> {
      await prisma.$disconnect();
      await pool.end();
    },
  };
}

/**
 * Convenience helper returning the PrismaClient instance directly.
 * Requires an explicit databaseUrl string (no process.env fallback).
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return createDatabaseClient(databaseUrl).prisma;
}
