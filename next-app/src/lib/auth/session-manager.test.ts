/**
 * Tests for SessionManager
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock ioredis
vi.mock('ioredis', () => {
  return {
    default: class MockRedis {
      setex = vi.fn().mockResolvedValue('OK');
      get = vi.fn().mockResolvedValue(null);
      del = vi.fn().mockResolvedValue(1);
      expire = vi.fn().mockResolvedValue(1);
      exists = vi.fn().mockResolvedValue(0);
      quit = vi.fn().mockResolvedValue('OK');
    },
  };
});

// Mock session encryptor
vi.mock('../encryption/session-encryptor', () => ({
  SessionEncryptor: class MockSessionEncryptor {
    dump = vi.fn().mockResolvedValue(Buffer.from('encrypted'));
    load = vi.fn().mockResolvedValue({ userId: 1 });
  },
}));

// Mock config
vi.mock('../config', () => ({
  getConfig: vi.fn().mockReturnValue({
    redisUrl: 'redis://localhost:6379',
  }),
}));

import {
  SessionManager,
  generateSessionId,
  type SessionData,
} from './session-manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('create', () => {
    test('creates session with encrypted data', async () => {
      const sessionId = 'test-session-123';
      const data: SessionData = {
        userId: 1,
        userUuid: 'uuid-123',
        email: 'test@example.com',
      };

      await manager.create(sessionId, data);
      // Verify it doesn't throw
    });
  });

  describe('get', () => {
    test('returns null for missing session', async () => {
      const result = await manager.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('destroy', () => {
    test('deletes session', async () => {
      await manager.destroy('test-session');
      // Verify it doesn't throw
    });
  });

  describe('exists', () => {
    test('returns false for missing session', async () => {
      const result = await manager.exists('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    test('closes redis connection', async () => {
      await manager.close();
      // Verify it doesn't throw
    });
  });
});

describe('generateSessionId', () => {
  test('generates random 64-character hex string', () => {
    const id = generateSessionId();
    expect(id).toHaveLength(64);
    expect(id).toMatch(/^[a-f0-9]+$/);
  });

  test('generates unique IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
  });
});

describe('SessionData interface', () => {
  test('supports all session fields', () => {
    const data: SessionData = {
      userId: 1,
      userUuid: 'uuid-123',
      email: 'test@example.com',
      signInFlow: 'sign_in',
      signInFailureCount: 0,
      mfaVerified: true,
      mfaVerifiedAt: '2024-01-01T00:00:00Z',
      deviceId: 'device-123',
      spSession: {
        issuer: 'urn:gov:gsa:openidconnect:sp:test',
        requestUrl: 'https://sp.example.com/auth',
      },
      idv: {
        status: 'pending',
      },
      flash: {
        flashes: { notice: 'Hello' },
      },
      totpSetupSecret: 'ABCDEFGH',
      backupCodes: ['code1', 'code2'],
      mfaSelections: ['totp'],
      completedMfa: ['totp'],
      customField: 'custom-value',
    };

    expect(data.userId).toBe(1);
    expect(data.spSession?.issuer).toBe('urn:gov:gsa:openidconnect:sp:test');
    expect(data.customField).toBe('custom-value');
  });
});
