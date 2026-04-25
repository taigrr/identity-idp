/**
 * Health Check Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  checkDatabaseHealth,
  checkRedisHealth,
  MultiHealthChecker,
  createDatabaseChecker,
  createRedisChecker,
} from './index';

describe('Health Check Services', () => {
  describe('checkDatabaseHealth', () => {
    it('returns healthy when database query succeeds', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [{ value: 1 }] }),
      };

      const result = await checkDatabaseHealth(mockDb as any);

      expect(result.healthy).toBe(true);
      expect(result.result).toEqual([1]);
    });

    it('returns unhealthy when database query fails', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Connection refused')),
      };

      const result = await checkDatabaseHealth(mockDb as any);

      expect(result.healthy).toBe(false);
      expect(result.result).toBe('Connection refused');
    });
  });

  describe('checkRedisHealth', () => {
    it('returns healthy when redis ping succeeds', async () => {
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
      };

      const result = await checkRedisHealth(mockRedis);

      expect(result.healthy).toBe(true);
      expect(result.result).toBe('PONG');
    });

    it('returns unhealthy when redis ping fails', async () => {
      const mockRedis = {
        ping: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
      };

      const result = await checkRedisHealth(mockRedis);

      expect(result.healthy).toBe(false);
      expect(result.result).toBe('Redis unavailable');
    });

    it('returns unhealthy when redis returns non-PONG response', async () => {
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('ERROR'),
      };

      const result = await checkRedisHealth(mockRedis);

      expect(result.healthy).toBe(false);
      expect(result.result).toBe('ERROR');
    });
  });

  describe('MultiHealthChecker', () => {
    it('returns healthy when all checks pass', async () => {
      const checker = new MultiHealthChecker({
        database: async () => ({ healthy: true, result: [1] }),
        redis: async () => ({ healthy: true, result: 'PONG' }),
      });

      const result = await checker.check();

      expect(result.healthy).toBe(true);
      expect(result.all_checks_healthy).toBe(true);
      expect(result.statuses.database.healthy).toBe(true);
      expect(result.statuses.redis.healthy).toBe(true);
    });

    it('returns unhealthy when any check fails', async () => {
      const checker = new MultiHealthChecker({
        database: async () => ({ healthy: true, result: [1] }),
        redis: async () => ({ healthy: false, result: 'Connection refused' }),
      });

      const result = await checker.check();

      expect(result.healthy).toBe(false);
      expect(result.all_checks_healthy).toBe(false);
      expect(result.statuses.database.healthy).toBe(true);
      expect(result.statuses.redis.healthy).toBe(false);
    });

    it('runs checks in parallel', async () => {
      const startTimes: number[] = [];
      const delay = 50;

      const checker = new MultiHealthChecker({
        check1: async () => {
          startTimes.push(Date.now());
          await new Promise((r) => setTimeout(r, delay));
          return { healthy: true, result: 1 };
        },
        check2: async () => {
          startTimes.push(Date.now());
          await new Promise((r) => setTimeout(r, delay));
          return { healthy: true, result: 2 };
        },
      });

      const start = Date.now();
      await checker.check();
      const duration = Date.now() - start;

      // If parallel, should complete in ~delay ms, not 2*delay
      expect(duration).toBeLessThan(delay * 1.5);
      // Both should have started at nearly the same time
      expect(Math.abs(startTimes[0] - startTimes[1])).toBeLessThan(10);
    });
  });

  describe('createDatabaseChecker', () => {
    it('creates a bound checker function', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [{ value: 1 }] }),
      };

      const checker = createDatabaseChecker(mockDb as any);
      const result = await checker();

      expect(result.healthy).toBe(true);
      expect(mockDb.execute).toHaveBeenCalled();
    });
  });

  describe('createRedisChecker', () => {
    it('creates a bound checker function', async () => {
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
      };

      const checker = createRedisChecker(mockRedis);
      const result = await checker();

      expect(result.healthy).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });
});
