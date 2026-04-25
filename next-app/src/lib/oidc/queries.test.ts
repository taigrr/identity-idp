/**
 * OIDC Database Queries Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOidcQueries,
  findIdentityByCode,
  findIdentityByAccessToken,
  findServiceProvider,
  clearAuthorizationCode,
} from './queries';

// Mock the drizzle select/update operations
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
};

// Helper to create chainable mock
function createChainMock(results: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(results),
    set: vi.fn().mockReturnThis(),
  };
  return chain;
}

describe('OIDC Database Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findIdentityByCode', () => {
    it('returns null when no identity found', async () => {
      const chain = createChainMock([]);
      mockDb.select.mockReturnValue(chain);

      const result = await findIdentityByCode(mockDb as any, 'test-code');

      expect(result).toBeNull();
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('returns identity with user when found', async () => {
      const mockIdentity = {
        id: 1,
        userId: 100,
        serviceProvider: 'test-sp',
        sessionUuid: 'test-code',
        accessToken: 'token-123',
        nonce: 'nonce-123',
        scope: 'openid email',
        codeChallenge: 'challenge',
        acrValues: 'urn:acr.login.gov:verified',
        ial: 2,
        requestedAalValue: null,
        updatedAt: new Date(),
        railsSessionId: 'session-123',
        emailAddressId: 50,
        user: {
          id: 100,
          uuid: 'user-uuid-123',
        },
      };
      
      const identityChain = createChainMock([mockIdentity]);
      const emailChain = createChainMock([{ id: 50, encryptedEmail: 'encrypted@email.com' }]);
      
      mockDb.select
        .mockReturnValueOnce(identityChain)
        .mockReturnValueOnce(emailChain);

      const result = await findIdentityByCode(mockDb as any, 'test-code');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.user?.uuid).toBe('user-uuid-123');
      expect(result?.emailAddress?.encryptedEmail).toBe('encrypted@email.com');
    });

    it('returns identity without email when emailAddressId is null', async () => {
      const mockIdentity = {
        id: 1,
        userId: 100,
        serviceProvider: 'test-sp',
        sessionUuid: 'test-code',
        accessToken: 'token-123',
        nonce: null,
        scope: 'openid',
        codeChallenge: null,
        acrValues: null,
        ial: 1,
        requestedAalValue: null,
        updatedAt: new Date(),
        railsSessionId: 'session-123',
        emailAddressId: null,
        user: {
          id: 100,
          uuid: 'user-uuid-123',
        },
      };
      
      const chain = createChainMock([mockIdentity]);
      mockDb.select.mockReturnValue(chain);

      const result = await findIdentityByCode(mockDb as any, 'test-code');

      expect(result).not.toBeNull();
      expect(result?.emailAddress).toBeNull();
      // Only one select call, no email lookup
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('findIdentityByAccessToken', () => {
    it('returns null when no identity found', async () => {
      const chain = createChainMock([]);
      mockDb.select.mockReturnValue(chain);

      const result = await findIdentityByAccessToken(mockDb as any, 'unknown-token');

      expect(result).toBeNull();
    });

    it('returns identity with user data for userinfo', async () => {
      const mockIdentity = {
        id: 1,
        userId: 100,
        serviceProvider: 'test-sp',
        accessToken: 'valid-token',
        scope: 'openid email profile',
        acrValues: 'urn:acr.login.gov:verified',
        vtr: null,
        ial: 2,
        aal: 2,
        verifiedAttributes: ['first_name', 'last_name'],
        verifiedAt: new Date(),
        railsSessionId: 'session-123',
        emailAddressId: 50,
        user: {
          id: 100,
          uuid: 'user-uuid-456',
        },
      };
      
      const identityChain = createChainMock([mockIdentity]);
      const emailChain = createChainMock([{ id: 50, encryptedEmail: 'encrypted@email.com' }]);
      
      mockDb.select
        .mockReturnValueOnce(identityChain)
        .mockReturnValueOnce(emailChain);

      const result = await findIdentityByAccessToken(mockDb as any, 'valid-token');

      expect(result).not.toBeNull();
      expect(result?.scope).toBe('openid email profile');
      expect(result?.user?.uuid).toBe('user-uuid-456');
    });
  });

  describe('findServiceProvider', () => {
    it('returns null when no service provider found', async () => {
      const chain = createChainMock([]);
      mockDb.select.mockReturnValue(chain);

      const result = await findServiceProvider(mockDb as any, 'unknown-issuer');

      expect(result).toBeNull();
    });

    it('returns service provider data', async () => {
      const mockSp = {
        id: 1,
        issuer: 'urn:gov:gsa:test-sp',
        pkce: true,
        certs: ['cert1', 'cert2'],
        ial: 2,
      };
      
      const chain = createChainMock([mockSp]);
      mockDb.select.mockReturnValue(chain);

      const result = await findServiceProvider(mockDb as any, 'urn:gov:gsa:test-sp');

      expect(result).not.toBeNull();
      expect(result?.issuer).toBe('urn:gov:gsa:test-sp');
      expect(result?.pkce).toBe(true);
      expect(result?.certs).toHaveLength(2);
    });
  });

  describe('clearAuthorizationCode', () => {
    it('updates identity to clear session_uuid', async () => {
      const chain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      };
      mockDb.update.mockReturnValue(chain);

      await clearAuthorizationCode(mockDb as any, 123);

      expect(mockDb.update).toHaveBeenCalled();
      expect(chain.set).toHaveBeenCalledWith({ sessionUuid: null });
    });
  });

  describe('createOidcQueries', () => {
    it('creates bound query functions', () => {
      const queries = createOidcQueries(mockDb as any);

      expect(queries.findIdentityByCode).toBeDefined();
      expect(queries.findIdentityByAccessToken).toBeDefined();
      expect(queries.findServiceProvider).toBeDefined();
      expect(queries.clearAuthorizationCode).toBeDefined();
    });

    it('bound functions use provided db instance', async () => {
      const chain = createChainMock([]);
      mockDb.select.mockReturnValue(chain);

      const queries = createOidcQueries(mockDb as any);
      await queries.findIdentityByCode('test-code');

      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
