/**
 * Auth App (TOTP) Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuthAppConfiguration,
  getUserAuthAppConfigurations,
  authenticateAuthApp,
  confirmAuthAppSetup,
  deleteAuthAppConfiguration,
  renameAuthAppConfiguration,
} from './auth-app';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          encryptedOtpSecretKey: 'encrypted-secret',
          name: 'Test Auth App',
          totpTimestamp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    query: {
      authAppConfigurations: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
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
  authAppConfigurations: {},
}));

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn().mockResolvedValue('encrypted-value'),
  decrypt: vi.fn().mockResolvedValue('decrypted-value'),
}));

// Mock TOTP verification
vi.mock('@/lib/mfa/totp', () => ({
  verifyTotpCode: vi.fn().mockReturnValue(12345),
}));

describe('Auth App Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthAppConfiguration', () => {
    it('creates a new auth app configuration', async () => {
      const result = await createAuthAppConfiguration({
        userId: 1,
        otpSecretKey: 'JBSWY3DPEHPK3PXP',
        name: 'My Auth App',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  describe('confirmAuthAppSetup', () => {
    it('returns timestamp for valid code', async () => {
      const result = await confirmAuthAppSetup('JBSWY3DPEHPK3PXP', '123456');
      expect(result).toBe(12345);
    });
  });
});
