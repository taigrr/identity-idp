/**
 * Email Address Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fingerprintEmail,
  generateConfirmationToken,
  createEmailAddress,
  findByConfirmationToken,
  confirmEmail,
  isEmailConfirmedByAnotherUser,
  getUserEmailAddresses,
  getUserConfirmedEmailAddresses,
  deleteEmailAddress,
  countConfirmedEmails,
  isOnlyConfirmedEmail,
} from './emails';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      emailAddresses: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          encryptedEmail: 'encrypted',
          emailFingerprint: 'fingerprint',
          confirmationToken: 'token',
          confirmedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
  },
  emailAddresses: {},
}));

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn().mockResolvedValue('encrypted-value'),
  decrypt: vi.fn().mockResolvedValue('test@example.gov'),
}));

describe('Email Address Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fingerprintEmail', () => {
    it('creates consistent fingerprints', () => {
      const fp1 = fingerprintEmail('test@example.com');
      const fp2 = fingerprintEmail('test@example.com');
      expect(fp1).toBe(fp2);
    });

    it('normalizes email before fingerprinting', () => {
      const fp1 = fingerprintEmail('Test@Example.Com');
      const fp2 = fingerprintEmail('test@example.com');
      expect(fp1).toBe(fp2);
    });

    it('handles whitespace', () => {
      const fp1 = fingerprintEmail('  test@example.com  ');
      const fp2 = fingerprintEmail('test@example.com');
      expect(fp1).toBe(fp2);
    });
  });

  describe('generateConfirmationToken', () => {
    it('generates unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateConfirmationToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('generates tokens with expected length', () => {
      const token = generateConfirmationToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('createEmailAddress', () => {
    it('creates an email address', async () => {
      const result = await createEmailAddress(1, 'test@example.gov');
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  describe('confirmEmail', () => {
    it('returns error for invalid token', async () => {
      const result = await confirmEmail('invalid-token');
      expect(result.success).toBe(false);
    });
  });

  describe('countConfirmedEmails', () => {
    it('returns count', async () => {
      const count = await countConfirmedEmails(1);
      expect(typeof count).toBe('number');
    });
  });
});
