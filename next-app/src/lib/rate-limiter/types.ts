/**
 * Rate Limiter Types
 * Migrated from Rails app/services/rate_limiter.rb
 */

export type RateLimitType =
  | 'account_reset_request'
  | 'account_reset_max_attempts'
  | 'idv_doc_auth'
  | 'reg_unconfirmed_email'
  | 'reg_confirmed_email'
  | 'reset_password_email'
  | 'idv_resolution'
  | 'idv_send_link'
  | 'verify_personal_key'
  | 'verify_gpo_key'
  | 'proof_ssn'
  | 'proof_address'
  | 'phone_confirmation'
  | 'phone_otp'
  | 'short_term_phone_otp'
  | 'sign_in_user_id_per_ip'
  | 'backup_code_user_id_per_ip';

export interface RateLimitConfig {
  maxAttempts: number;
  attemptWindowMinutes: number;
  attemptWindowExponentialFactor?: number;
  attemptWindowMaxMinutes?: number;
}

export type RateLimitConfigMap = Record<RateLimitType, RateLimitConfig>;

export interface RateLimiterUser {
  id: string;
}

export interface RateLimiterOptions {
  rateLimitType: RateLimitType;
  user?: RateLimiterUser;
  target?: string;
}

export interface RateLimiterState {
  attempts: number;
  attemptedAt: Date | null;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { exat?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<number>;
  expireat(key: string, timestamp: number): Promise<void>;
  expiretime(key: string): Promise<number>;
  eval(script: string, keys: string[], args: string[]): Promise<number>;
  evalsha(sha: string, keys: string[], args: string[]): Promise<number>;
  multi(): RedisMulti;
}

export interface RedisMulti {
  get(key: string): RedisMulti;
  incr(key: string): RedisMulti;
  expireat(key: string, timestamp: number): RedisMulti;
  expiretime(key: string): RedisMulti;
  exec(): Promise<unknown[]>;
}

export interface RateLimiterDeps {
  redis: RedisClient;
  config: RateLimitConfigMap;
  now?: () => Date;
}
