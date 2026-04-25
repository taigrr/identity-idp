/**
 * User Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUser,
  findUserById,
  findUserByUuid,
  findUserByEmail,
  findUserByResetToken,
  authenticateUser,
  updatePassword,
  setResetPasswordToken,
  confirmUser,
  acceptTerms,
  suspendUser,
  reinstateUser,
  isUserSuspended,
  lockSecondFactor,
  unlockSecondFactor,
  incrementSecondFactorAttempts,
  resetSecondFactorAttempts,
  setEmailLanguage,
  getEmailLanguage,
} from './users';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      emailAddresses: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          uuid: 'test-uuid',
          encryptedPasswordDigest: 'encrypted',
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
    transaction: vi.fn().mockImplementation(async (fn) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }),
      };
      return fn(tx);
    }),
  },
  users: {},
  emailAddresses: {},
}));

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn().mockResolvedValue('encrypted-value'),
  decrypt: vi.fn().mockResolvedValue('decrypted-value'),
}));

// Mock password verifier
vi.mock('@/lib/auth/password-verifier', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('creates a user with email', async () => {
      const result = await createUser('test@example.gov', 'password123456');
      expect(result.user).toBeDefined();
      expect(result.emailAddress).toBeDefined();
    });
  });

  describe('findUserById', () => {
    it('returns null for non-existent user', async () => {
      const result = await findUserById(999);
      expect(result).toBeNull();
    });
  });

  describe('findUserByUuid', () => {
    it('returns null for non-existent user', async () => {
      const result = await findUserByUuid('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('returns null for non-existent email', async () => {
      const result = await findUserByEmail('nonexistent@example.gov');
      expect(result).toBeNull();
    });
  });

  describe('findUserByResetToken', () => {
    it('returns null for invalid token', async () => {
      const result = await findUserByResetToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('returns success', async () => {
      const result = await updatePassword(1, 'newpassword123456');
      expect(result).toBe(true);
    });
  });

  describe('setResetPasswordToken', () => {
    it('returns token', async () => {
      const token = await setResetPasswordToken(1);
      expect(token).toBeDefined();
    });
  });

  describe('isUserSuspended', () => {
    it('returns boolean', async () => {
      const result = await isUserSuspended(1);
      expect(typeof result).toBe('boolean');
    });
  });
});
