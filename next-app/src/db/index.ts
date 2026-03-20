import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database connection configuration
 *
 * In production, these should come from environment variables
 * that are populated by AWS Secrets Manager / Parameter Store
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // FedRAMP compliance: enforce SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  // Connection pool settings for high availability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

// Re-export schema for convenience
export * from './schema';
