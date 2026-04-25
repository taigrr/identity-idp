/**
 * Rate Limiter
 * Migrated from Rails app/services/rate_limiter.rb
 * 
 * Rate limit period begins once the maximum number of allowed attempts has been reached.
 * Supports exponential backoff for certain rate limit types.
 */

import {
  RateLimitType,
  RateLimitConfig,
  RateLimiterOptions,
  RateLimiterDeps,
  RateLimiterUser,
} from './types';
import { createHash } from 'crypto';

const EXPONENTIAL_INCREMENT_SCRIPT = `
local count = redis.call('incr', KEYS[1])
local now = tonumber(ARGV[1])
local minutes = tonumber(ARGV[2])
local exponential_factor = tonumber(ARGV[3])
local attempt_window_max = tonumber(ARGV[4])
minutes = math.floor(minutes * (exponential_factor ^ (count - 1)))
if attempt_window_max then
  minutes = math.min(minutes, attempt_window_max)
end
redis.call('expireat', KEYS[1], now + (minutes * 60))
return count
`;

const EXPONENTIAL_INCREMENT_SCRIPT_SHA1 = createHash('sha1')
  .update(EXPONENTIAL_INCREMENT_SCRIPT)
  .digest('hex');

export class RateLimiter {
  private rateLimitType: RateLimitType;
  private user?: RateLimiterUser;
  private target?: string;
  private deps: RateLimiterDeps;
  
  private _attempts?: number;
  private _attemptedAt?: Date | null;

  constructor(options: RateLimiterOptions, deps: RateLimiterDeps) {
    this.rateLimitType = options.rateLimitType;
    this.user = options.user;
    this.target = options.target;
    this.deps = deps;

    if (!deps.config[options.rateLimitType]) {
      throw new Error(`rate_limit_type '${options.rateLimitType}' is not valid`);
    }

    if (!this.user && !this.target) {
      throw new Error('RateLimiter must have a user or a target, but neither were provided');
    }

    if (this.user && this.target) {
      throw new Error('RateLimiter must have a user or a target, but both were provided');
    }

    if (this.target && typeof this.target !== 'string') {
      throw new Error(`target must be a string, but got ${typeof this.target}`);
    }
  }

  private get config(): RateLimitConfig {
    return this.deps.config[this.rateLimitType];
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  get key(): string {
    if (this.user) {
      return `throttle:throttle:${this.user.id}:${this.rateLimitType}`;
    }
    return `throttle:throttle:${this.target}:${this.rateLimitType}`;
  }

  async attempts(): Promise<number> {
    if (this._attempts !== undefined) {
      return this._attempts;
    }
    await this.fetchState();
    return this._attempts ?? 0;
  }

  async attemptedAt(): Promise<Date | null> {
    if (this._attemptedAt !== undefined) {
      return this._attemptedAt;
    }
    await this.fetchState();
    return this._attemptedAt ?? null;
  }

  async expiresAt(): Promise<Date | null> {
    const attempted = await this.attemptedAt();
    if (!attempted) {
      return null;
    }
    const minutes = await this.expirationMinutes();
    return new Date(attempted.getTime() + minutes * 60 * 1000);
  }

  async expired(): Promise<boolean | null> {
    const expires = await this.expiresAt();
    if (!expires) {
      return null;
    }
    return expires <= this.now();
  }

  async maxed(): Promise<boolean> {
    const attempts = await this.attempts();
    return attempts >= this.config.maxAttempts;
  }

  async limited(): Promise<boolean> {
    const expired = await this.expired();
    const maxed = await this.maxed();
    return !expired && maxed;
  }

  async remainingCount(): Promise<number> {
    const limited = await this.limited();
    if (limited) {
      return 0;
    }
    const attempts = await this.attempts();
    return this.config.maxAttempts - attempts;
  }

  async expirationMinutes(): Promise<number> {
    let minutes = this.config.attemptWindowMinutes;
    const exponentialFactor = this.config.attemptWindowExponentialFactor;
    const attemptWindowMax = this.config.attemptWindowMaxMinutes;
    const attempts = await this.attempts();

    if (exponentialFactor && attempts > 0) {
      minutes *= Math.pow(exponentialFactor, attempts - 1);
    }

    if (attemptWindowMax && minutes > attemptWindowMax) {
      return attemptWindowMax;
    }

    return minutes;
  }

  async increment(): Promise<number> {
    const limited = await this.limited();
    if (limited) {
      return this._attempts ?? 0;
    }

    const minutes = this.config.attemptWindowMinutes;
    const exponentialFactor = this.config.attemptWindowExponentialFactor;
    const now = this.now();
    const redis = this.deps.redis;

    let value: number;

    if (exponentialFactor) {
      const attemptWindowMax = this.config.attemptWindowMaxMinutes;
      const scriptArgs = [
        Math.floor(now.getTime() / 1000).toString(),
        minutes.toString(),
        exponentialFactor.toString(),
        (attemptWindowMax ?? '').toString(),
      ];

      try {
        value = await redis.evalsha(EXPONENTIAL_INCREMENT_SCRIPT_SHA1, [this.key], scriptArgs);
      } catch (error) {
        if (error instanceof Error && error.message.includes('NOSCRIPT')) {
          value = await redis.eval(EXPONENTIAL_INCREMENT_SCRIPT, [this.key], scriptArgs);
        } else {
          throw error;
        }
      }
    } else {
      const multi = redis.multi();
      multi.incr(this.key);
      const expiryTime = Math.floor(now.getTime() / 1000) + minutes * 60;
      multi.expireat(this.key, expiryTime);
      const results = await multi.exec();
      value = results[0] as number;
    }

    this._attempts = value;
    this._attemptedAt = now;

    return this._attempts;
  }

  async fetchState(): Promise<this> {
    const multi = this.deps.redis.multi();
    multi.get(this.key);
    multi.expiretime(this.key);
    const results = await multi.exec();
    
    const value = results[0] as string | null;
    const expiretime = results[1] as number;

    this._attempts = value ? parseInt(value, 10) : 0;

    if (expiretime < 0) {
      this._attemptedAt = null;
    } else {
      const expirationMs = await this.expirationMinutes() * 60 * 1000;
      this._attemptedAt = new Date(expiretime * 1000 - expirationMs);
    }

    return this;
  }

  async reset(): Promise<void> {
    await this.deps.redis.del(this.key);
    this._attempts = 0;
    this._attemptedAt = null;
  }

  async incrementToLimited(): Promise<number> {
    const value = this.config.maxAttempts;
    const now = this.now();
    const expirationMs = await this.expirationMinutes() * 60;
    const expiryTimestamp = Math.floor(now.getTime() / 1000) + expirationMs;

    await this.deps.redis.set(this.key, value.toString(), { exat: expiryTimestamp });

    this._attempts = value;
    this._attemptedAt = now;

    return this._attempts;
  }
}

export function createRateLimiter(
  options: RateLimiterOptions,
  deps: RateLimiterDeps
): RateLimiter {
  return new RateLimiter(options, deps);
}
