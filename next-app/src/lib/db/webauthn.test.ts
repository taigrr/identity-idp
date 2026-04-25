/**
 * WebAuthn Configuration Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createWebauthnConfiguration,
  getUserWebauthnConfigurations,
  findByCredentialId,
  getWebauthnConfiguration,
  deleteWebauthnConfiguration,
  renameWebauthnConfiguration,
  getUserPasskeys,
  getUserSecurityKeys,
  countWebauthnConfigurations,
  hasWebauthnCredentials,
  hasPlatformAuthenticator,
} from './webauthn';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      webauthnConfigurations: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          name: 'My Security Key',
          credentialId: 'credential-id',
          credentialPublicKey: 'public-key',
          platformAuthenticator: false,
          transports: ['usb'],
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
  webauthnConfigurations: {},
}));

describe('WebAuthn Configuration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWebauthnConfiguration', () => {
    it('creates a webauthn configuration', async () => {
      const result = await createWebauthnConfiguration({
        userId: 1,
        name: 'My Security Key',
        credentialId: 'credential-id',
        credentialPublicKey: 'public-key',
        platformAuthenticator: false,
        transports: ['usb'],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('My Security Key');
    });
  });

  describe('getUserPasskeys', () => {
    it('filters for platform authenticators', async () => {
      const passkeys = await getUserPasskeys(1);
      expect(Array.isArray(passkeys)).toBe(true);
    });
  });

  describe('getUserSecurityKeys', () => {
    it('filters for non-platform authenticators', async () => {
      const keys = await getUserSecurityKeys(1);
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('countWebauthnConfigurations', () => {
    it('returns count', async () => {
      const count = await countWebauthnConfigurations(1);
      expect(typeof count).toBe('number');
    });
  });

  describe('hasWebauthnCredentials', () => {
    it('returns boolean', async () => {
      const result = await hasWebauthnCredentials(1);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('hasPlatformAuthenticator', () => {
    it('returns boolean', async () => {
      const result = await hasPlatformAuthenticator(1);
      expect(typeof result).toBe('boolean');
    });
  });
});
