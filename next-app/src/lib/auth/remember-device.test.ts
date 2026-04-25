/**
 * Remember Device Cookie tests
 * Mirrors: spec/services/remember_device_cookie_spec.rb
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RememberDeviceCookie,
  COOKIE_ROLE,
  createRememberDeviceCookie,
  parseRememberDeviceCookie,
} from './remember-device';

describe('RememberDeviceCookie', () => {
  const userId = 'user-123';
  const now = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  describe('constructor', () => {
    it('creates cookie with userId and createdAt', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      expect(cookie.userId).toBe(userId);
      expect(cookie.createdAt).toEqual(now);
    });
  });

  describe('fromJson', () => {
    it('parses valid JSON', () => {
      const json = JSON.stringify({
        user_id: userId,
        created_at: now.toISOString(),
        role: COOKIE_ROLE,
        entropy: 'abc123',
      });

      const cookie = RememberDeviceCookie.fromJson(json);
      expect(cookie.userId).toBe(userId);
      expect(cookie.createdAt.toISOString()).toBe(now.toISOString());
    });

    it('throws on invalid role', () => {
      const json = JSON.stringify({
        user_id: userId,
        created_at: now.toISOString(),
        role: 'invalid_role',
        entropy: 'abc123',
      });

      expect(() => RememberDeviceCookie.fromJson(json)).toThrow(
        "RememberDeviceCookie role 'invalid_role' did not match 'remember_me'"
      );
    });

    it('throws on invalid JSON', () => {
      expect(() => RememberDeviceCookie.fromJson('not json')).toThrow();
    });
  });

  describe('toJson', () => {
    it('serializes to JSON with all required fields', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      const json = cookie.toJson();
      const parsed = JSON.parse(json);

      expect(parsed.user_id).toBe(userId);
      expect(parsed.created_at).toBe(now.toISOString());
      expect(parsed.role).toBe(COOKIE_ROLE);
      expect(parsed.entropy).toBeDefined();
      expect(typeof parsed.entropy).toBe('string');
    });

    it('generates unique entropy each time', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      const json1 = JSON.parse(cookie.toJson());
      const json2 = JSON.parse(cookie.toJson());

      expect(json1.entropy).not.toBe(json2.entropy);
    });
  });

  describe('validForUser', () => {
    const expirationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

    it('returns true for valid cookie', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      const user = { id: userId };

      expect(cookie.validForUser(user, expirationInterval)).toBe(true);
    });

    it('returns false for different user', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      const user = { id: 'different-user' };

      expect(cookie.validForUser(user, expirationInterval)).toBe(false);
    });

    it('returns false for expired cookie', () => {
      const oldDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const cookie = new RememberDeviceCookie({ userId, createdAt: oldDate });
      const user = { id: userId };

      expect(cookie.validForUser(user, expirationInterval)).toBe(false);
    });

    it('returns false when device was revoked after cookie creation', () => {
      const cookieDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const revokedDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      
      const cookie = new RememberDeviceCookie({ userId, createdAt: cookieDate });
      const user = { id: userId, rememberDeviceRevokedAt: revokedDate };

      expect(cookie.validForUser(user, expirationInterval)).toBe(false);
    });

    it('returns true when cookie was created after revocation', () => {
      const revokedDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const cookieDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      
      const cookie = new RememberDeviceCookie({ userId, createdAt: cookieDate });
      const user = { id: userId, rememberDeviceRevokedAt: revokedDate };

      expect(cookie.validForUser(user, expirationInterval)).toBe(true);
    });

    it('returns true when rememberDeviceRevokedAt is null', () => {
      const cookie = new RememberDeviceCookie({ userId, createdAt: now });
      const user = { id: userId, rememberDeviceRevokedAt: null };

      expect(cookie.validForUser(user, expirationInterval)).toBe(true);
    });
  });
});

describe('createRememberDeviceCookie', () => {
  it('creates cookie with current time by default', () => {
    vi.useFakeTimers();
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const cookie = createRememberDeviceCookie('user-456');
    expect(cookie.userId).toBe('user-456');
    expect(cookie.createdAt.toISOString()).toBe(now.toISOString());
  });

  it('creates cookie with specified time', () => {
    const customDate = new Date('2023-06-01T00:00:00Z');
    const cookie = createRememberDeviceCookie('user-456', customDate);
    expect(cookie.createdAt).toEqual(customDate);
  });
});

describe('parseRememberDeviceCookie', () => {
  it('returns cookie for valid JSON', () => {
    const json = JSON.stringify({
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      role: COOKIE_ROLE,
      entropy: 'xyz',
    });

    const cookie = parseRememberDeviceCookie(json);
    expect(cookie).not.toBeNull();
    expect(cookie?.userId).toBe('user-123');
  });

  it('returns null for invalid JSON', () => {
    expect(parseRememberDeviceCookie('invalid')).toBeNull();
  });

  it('returns null for wrong role', () => {
    const json = JSON.stringify({
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      role: 'wrong_role',
      entropy: 'xyz',
    });

    expect(parseRememberDeviceCookie(json)).toBeNull();
  });
});
