/**
 * Health Check Services
 * Mirrors: app/services/database_health_checker.rb, multi_health_checker.rb
 */

import { sql } from 'drizzle-orm';
import type { Database } from '@/db';

/**
 * Health check summary
 */
export interface HealthCheckSummary {
  healthy: boolean;
  result: unknown;
}

/**
 * Multi-health check response
 */
export interface MultiHealthCheckResponse {
  statuses: Record<string, HealthCheckSummary>;
  healthy: boolean;
  all_checks_healthy: boolean;
}

/**
 * Check database health by executing SELECT 1
 * Mirrors: DatabaseHealthChecker.check
 */
export async function checkDatabaseHealth(db: Database): Promise<HealthCheckSummary> {
  try {
    const result = await db.execute(sql`SELECT 1 as value`);
    return {
      healthy: true,
      result: result.rows.map((r: any) => r.value),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      result: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis health by executing PING
 */
export async function checkRedisHealth(redis: {
  ping: () => Promise<string>;
}): Promise<HealthCheckSummary> {
  try {
    const result = await redis.ping();
    return {
      healthy: result === 'PONG',
      result,
    };
  } catch (error) {
    console.error('Redis health check failed:', error);
    return {
      healthy: false,
      result: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Multi-health checker that runs multiple health checks
 * Mirrors: MultiHealthChecker
 */
export class MultiHealthChecker {
  private checkers: Map<string, () => Promise<HealthCheckSummary>>;

  constructor(checkers: Record<string, () => Promise<HealthCheckSummary>>) {
    this.checkers = new Map(Object.entries(checkers));
  }

  async check(): Promise<MultiHealthCheckResponse> {
    const statuses: Record<string, HealthCheckSummary> = {};

    // Run all checks in parallel
    const entries = Array.from(this.checkers.entries());
    const results = await Promise.all(
      entries.map(async ([name, checker]) => {
        const result = await checker();
        return [name, result] as const;
      }),
    );

    for (const [name, result] of results) {
      statuses[name] = result;
    }

    const healthy = Object.values(statuses).every((s) => s.healthy);

    return {
      statuses,
      healthy,
      all_checks_healthy: healthy,
    };
  }
}

/**
 * Create a bound database health checker
 */
export function createDatabaseChecker(db: Database) {
  return () => checkDatabaseHealth(db);
}

/**
 * Create a bound redis health checker
 */
export function createRedisChecker(redis: { ping: () => Promise<string> }) {
  return () => checkRedisHealth(redis);
}
