/**
 * Session Manager - handles Redis-based session storage
 * Mirrors Rails session handling with Redis backend
 *
 * Sessions are encrypted using AES + KMS before storage.
 */

import Redis from 'ioredis';
import { SessionEncryptor } from '../encryption/session-encryptor';
import { getConfig } from '../config';

export interface SessionData {
  userId?: number;
  userUuid?: string;
  email?: string;
  signInFlow?: 'sign_in' | 'sign_up';
  signInFailureCount?: number;
  maxSignInFailuresAt?: number;
  signInPageVisitedAt?: string;
  mfaVerified?: boolean;
  mfaVerifiedAt?: string;
  deviceId?: string;
  spSession?: {
    issuer?: string;
    requestUrl?: string;
  };
  idv?: Record<string, unknown>;
  flash?: {
    flashes?: Record<string, unknown>;
  };
  // MFA setup flow
  totpSetupSecret?: string;
  backupCodes?: string[];
  mfaSelections?: string[];
  completedMfa?: string[];
  [key: string]: unknown;
}

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds
const SESSION_PREFIX = 'session:';

export class SessionManager {
  private redis: Redis;
  private encryptor: SessionEncryptor;

  constructor() {
    const config = getConfig();
    this.redis = new Redis(config.redisUrl);
    this.encryptor = new SessionEncryptor();
  }

  /**
   * Creates a new session
   */
  async create(sessionId: string, data: SessionData): Promise<void> {
    const encrypted = await this.encryptor.dump(data);
    await this.redis.setex(
      SESSION_PREFIX + sessionId,
      SESSION_TTL,
      encrypted.toString('base64')
    );
  }

  /**
   * Retrieves a session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const encrypted = await this.redis.get(SESSION_PREFIX + sessionId);
    if (!encrypted) {
      return null;
    }

    const buffer = Buffer.from(encrypted, 'base64');
    return this.encryptor.load(buffer) as Promise<SessionData>;
  }

  /**
   * Updates an existing session
   */
  async update(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const existing = await this.get(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    const merged = { ...existing, ...data };
    await this.create(sessionId, merged);
  }

  /**
   * Deletes a session
   */
  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(SESSION_PREFIX + sessionId);
  }

  /**
   * Refreshes session TTL
   */
  async touch(sessionId: string): Promise<void> {
    await this.redis.expire(SESSION_PREFIX + sessionId, SESSION_TTL);
  }

  /**
   * Checks if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    const result = await this.redis.exists(SESSION_PREFIX + sessionId);
    return result === 1;
  }

  /**
   * Closes Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

/**
 * Global session manager instance
 */
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.close();
    sessionManagerInstance = null;
  }
}

/**
 * Convenience functions for server actions
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const manager = getSessionManager();
  return manager.get(sessionId);
}

export async function updateSession(
  sessionId: string,
  data: Partial<SessionData>
): Promise<void> {
  const manager = getSessionManager();
  await manager.update(sessionId, data);
}

export async function createSession(
  sessionId: string,
  data: SessionData
): Promise<void> {
  const manager = getSessionManager();
  await manager.create(sessionId, data);
}

export async function destroySession(sessionId: string): Promise<void> {
  const manager = getSessionManager();
  await manager.destroy(sessionId);
}
