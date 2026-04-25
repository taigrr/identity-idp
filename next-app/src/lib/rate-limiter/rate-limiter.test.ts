import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RateLimiter,
  RedisRateLimiter,
  LimitError,
  createDefaultConfig,
} from './index';
import type { RedisClient, RateLimitConfigMap } from './types';

function createMockRedis(): RedisClient & {
  storage: Map<string, { value: string; expiresAt: number }>;
} {
  const storage = new Map<string, { value: string; expiresAt: number }>();
  
  const redis: RedisClient & { storage: typeof storage } = {
    storage,
    async get(key: string) {
      const item = storage.get(key);
      if (!item) return null;
      if (item.expiresAt > 0 && item.expiresAt < Date.now() / 1000) {
        storage.delete(key);
        return null;
      }
      return item.value;
    },
    async set(key: string, value: string, options?: { exat?: number }) {
      storage.set(key, {
        value,
        expiresAt: options?.exat ?? -1,
      });
    },
    async incr(key: string) {
      const item = storage.get(key);
      const newValue = item ? parseInt(item.value, 10) + 1 : 1;
      storage.set(key, { value: newValue.toString(), expiresAt: item?.expiresAt ?? -1 });
      return newValue;
    },
    async del(key: string) {
      const existed = storage.has(key);
      storage.delete(key);
      return existed ? 1 : 0;
    },
    async expireat(key: string, timestamp: number) {
      const item = storage.get(key);
      if (item) {
        item.expiresAt = timestamp;
      }
    },
    async expiretime(key: string) {
      const item = storage.get(key);
      return item?.expiresAt ?? -1;
    },
    async eval(_script: string, keys: string[], args: string[]) {
      const key = keys[0];
      const minutes = parseFloat(args[1]);
      const now = parseInt(args[0], 10);
      const newValue = await redis.incr(key);
      await redis.expireat(key, now + minutes * 60);
      return newValue;
    },
    async evalsha(_sha: string, keys: string[], args: string[]) {
      return redis.eval('', keys, args);
    },
    multi() {
      const commands: Array<{ cmd: string; args: unknown[] }> = [];
      const multi = {
        get(key: string) {
          commands.push({ cmd: 'get', args: [key] });
          return multi;
        },
        incr(key: string) {
          commands.push({ cmd: 'incr', args: [key] });
          return multi;
        },
        expireat(key: string, timestamp: number) {
          commands.push({ cmd: 'expireat', args: [key, timestamp] });
          return multi;
        },
        expiretime(key: string) {
          commands.push({ cmd: 'expiretime', args: [key] });
          return multi;
        },
        async exec() {
          const results: unknown[] = [];
          for (const { cmd, args } of commands) {
            switch (cmd) {
              case 'get':
                results.push(await redis.get(args[0] as string));
                break;
              case 'incr':
                results.push(await redis.incr(args[0] as string));
                break;
              case 'expireat':
                results.push(await redis.expireat(args[0] as string, args[1] as number));
                break;
              case 'expiretime':
                results.push(await redis.expiretime(args[0] as string));
                break;
            }
          }
          return results;
        },
      };
      return multi;
    },
  };

  return redis;
}

describe('RateLimiter', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let config: RateLimitConfigMap;

  beforeEach(() => {
    redis = createMockRedis();
    config = createDefaultConfig();
  });

  describe('constructor', () => {
    it('throws if rate limit type is invalid', () => {
      expect(() => {
        new RateLimiter(
          { rateLimitType: 'invalid' as any, user: { id: '123' } },
          { redis, config }
        );
      }).toThrow('rate_limit_type');
    });

    it('throws if neither user nor target provided', () => {
      expect(() => {
        new RateLimiter(
          { rateLimitType: 'phone_otp' },
          { redis, config }
        );
      }).toThrow('neither were provided');
    });

    it('throws if both user and target provided', () => {
      expect(() => {
        new RateLimiter(
          { rateLimitType: 'phone_otp', user: { id: '123' }, target: 'test' },
          { redis, config }
        );
      }).toThrow('both were provided');
    });

    it('creates with user', () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );
      expect(limiter.key).toBe('throttle:throttle:123:phone_otp');
    });

    it('creates with target', () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', target: 'test@example.com' },
        { redis, config }
      );
      expect(limiter.key).toBe('throttle:throttle:test@example.com:phone_otp');
    });
  });

  describe('increment', () => {
    it('increments attempt count', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      await limiter.increment();
      expect(await limiter.attempts()).toBe(1);

      await limiter.increment();
      expect(await limiter.attempts()).toBe(2);
    });

    it('does not increment when already limited', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      const maxAttempts = config.phone_otp.maxAttempts;
      for (let i = 0; i < maxAttempts + 5; i++) {
        await limiter.increment();
      }

      expect(await limiter.attempts()).toBe(maxAttempts);
    });
  });

  describe('limited', () => {
    it('returns false when under limit', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      await limiter.increment();
      expect(await limiter.limited()).toBe(false);
    });

    it('returns true when at limit', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      const maxAttempts = config.phone_otp.maxAttempts;
      for (let i = 0; i < maxAttempts; i++) {
        await limiter.increment();
      }

      expect(await limiter.limited()).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets the rate limiter', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      await limiter.increment();
      await limiter.increment();
      expect(await limiter.attempts()).toBe(2);

      await limiter.reset();
      expect(await limiter.attempts()).toBe(0);
    });
  });

  describe('remainingCount', () => {
    it('returns correct remaining count', async () => {
      const limiter = new RateLimiter(
        { rateLimitType: 'phone_otp', user: { id: '123' } },
        { redis, config }
      );

      const maxAttempts = config.phone_otp.maxAttempts;
      expect(await limiter.remainingCount()).toBe(maxAttempts);

      await limiter.increment();
      expect(await limiter.remainingCount()).toBe(maxAttempts - 1);
    });
  });
});

describe('RedisRateLimiter', () => {
  let redis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    redis = createMockRedis();
  });

  describe('attempt', () => {
    it('executes function when not limited', async () => {
      const limiter = new RedisRateLimiter(
        { key: 'test', maxRequests: 5, intervalSeconds: 60 },
        { redis }
      );

      const fn = vi.fn().mockReturnValue('result');
      const result = await limiter.attempt(fn);

      expect(fn).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('throws LimitError when maxed', async () => {
      const limiter = new RedisRateLimiter(
        { key: 'test', maxRequests: 2, intervalSeconds: 60 },
        { redis }
      );

      await limiter.attempt(() => 'a');
      await limiter.attempt(() => 'b');

      await expect(limiter.attempt(() => 'c')).rejects.toThrow(LimitError);
    });
  });

  describe('buildKey', () => {
    it('creates time-bucketed key', () => {
      const limiter = new RedisRateLimiter(
        { key: 'test', maxRequests: 5, intervalSeconds: 60 },
        { redis }
      );

      const now = new Date('2024-01-01T12:00:30Z');
      const key = limiter.buildKey(now);

      expect(key).toMatch(/^throttle:redis-rate-limiter:test:\d+$/);
      expect(key).toContain('1704110400');
    });
  });
});

describe('createDefaultConfig', () => {
  it('creates config with defaults', () => {
    const config = createDefaultConfig();

    expect(config.phone_otp).toBeDefined();
    expect(config.phone_otp.maxAttempts).toBeGreaterThan(0);
    expect(config.phone_otp.attemptWindowMinutes).toBeGreaterThan(0);
  });

  it('uses environment overrides', () => {
    const config = createDefaultConfig({
      PHONE_CONFIRMATION_MAX_ATTEMPTS: 20,
    });

    expect(config.phone_confirmation.maxAttempts).toBe(20);
  });
});
