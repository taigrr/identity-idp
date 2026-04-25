/**
 * Redis Rate Limiter (Sliding Window)
 * Migrated from Rails app/services/redis_rate_limiter.rb
 * 
 * Implementation of https://redis.com/redis-best-practices/basic-rate-limiting/
 * Unlike RateLimiter, this uses a sliding window approach.
 */

import { RedisClient } from './types';

export class LimitError extends Error {
  constructor(key: string) {
    super(`rate limit for ${key} has maxed out`);
    this.name = 'LimitError';
  }
}

export interface RedisRateLimiterOptions {
  key: string;
  maxRequests: number;
  intervalSeconds: number;
}

export interface RedisRateLimiterDeps {
  redis: RedisClient;
  now?: () => Date;
}

export class RedisRateLimiter {
  readonly key: string;
  readonly maxRequests: number;
  readonly interval: number;
  private deps: RedisRateLimiterDeps;

  constructor(options: RedisRateLimiterOptions, deps: RedisRateLimiterDeps) {
    this.key = options.key;
    this.maxRequests = options.maxRequests;
    this.interval = Math.floor(options.intervalSeconds);
    this.deps = deps;
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  buildKey(now: Date = this.now()): string {
    const timestamp = Math.floor(now.getTime() / 1000);
    const roundedSeconds = Math.floor(timestamp / this.interval) * this.interval;
    return `throttle:redis-rate-limiter:${this.key}:${roundedSeconds}`;
  }

  async maxed(now: Date = this.now()): Promise<boolean> {
    const key = this.buildKey(now);
    const value = await this.deps.redis.get(key);
    return (parseInt(value ?? '0', 10)) >= this.maxRequests;
  }

  async increment(now: Date = this.now()): Promise<void> {
    const rateLimitKey = this.buildKey(now);
    const multi = this.deps.redis.multi();
    multi.incr(rateLimitKey);
    multi.expireat(rateLimitKey, Math.floor(now.getTime() / 1000) + this.interval - 1);
    await multi.exec();
  }

  async attempt<T>(
    fn: () => T | Promise<T>,
    now: Date = this.now()
  ): Promise<T> {
    if (await this.maxed(now)) {
      throw new LimitError(this.key);
    }

    await this.increment(now);
    return fn();
  }
}

export function createRedisRateLimiter(
  options: RedisRateLimiterOptions,
  deps: RedisRateLimiterDeps
): RedisRateLimiter {
  return new RedisRateLimiter(options, deps);
}
