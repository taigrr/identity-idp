/**
 * Identity Linker tests
 * Mirrors: spec/services/identity_linker_spec.rb
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  IdentityLinker,
  createIdentityLinker,
  IAL1,
  IAL2,
  type IdentityLinkerDeps,
  type ServiceProviderIdentity,
} from './identity-linker';

const mockUser = { id: 'user-123' };
const mockServiceProvider = { issuer: 'urn:gov:gsa:openidconnect:test' };

const mockIdentity: ServiceProviderIdentity = {
  id: 'identity-1',
  userId: 'user-123',
  serviceProvider: 'urn:gov:gsa:openidconnect:test',
  verifiedAttributes: ['email'],
  verifiedAt: null,
  lastIal1AuthenticatedAt: null,
  lastIal2AuthenticatedAt: null,
};

const createMockDeps = (overrides: Partial<IdentityLinkerDeps> = {}): IdentityLinkerDeps => ({
  findOrCreateIdentity: vi.fn().mockResolvedValue({ ...mockIdentity }),
  updateIdentity: vi.fn().mockImplementation((id, data) => 
    Promise.resolve({ ...mockIdentity, ...data })
  ),
  ...overrides,
});

describe('IdentityLinker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  describe('linkIdentity', () => {
    it('links identity with basic attributes', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      const result = await linker.linkIdentity({
        ial: IAL1,
        aal: 2,
        scope: 'openid email',
        nonce: 'test-nonce',
      });

      expect(result).not.toBeNull();
      expect(deps.findOrCreateIdentity).toHaveBeenCalledWith(
        mockUser.id,
        mockServiceProvider.issuer
      );
      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          ial: IAL1,
          aal: 2,
          scope: 'openid email',
          nonce: 'test-nonce',
        })
      );
    });

    it('generates new session UUID and access token', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL1 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          sessionUuid: expect.any(String),
          accessToken: expect.any(String),
        })
      );
    });

    it('sets lastAuthenticatedAt to current time', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL1 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          lastAuthenticatedAt: new Date('2024-01-15T12:00:00Z'),
        })
      );
    });

    it('returns null when user is missing', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(
        null as unknown as typeof mockUser,
        mockServiceProvider,
        deps
      );

      const result = await linker.linkIdentity({ ial: IAL1 });

      expect(result).toBeNull();
      expect(deps.findOrCreateIdentity).not.toHaveBeenCalled();
    });

    it('returns null when service provider is missing', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(
        mockUser,
        null as unknown as typeof mockServiceProvider,
        deps
      );

      const result = await linker.linkIdentity({ ial: IAL1 });

      expect(result).toBeNull();
    });
  });

  describe('IAL processing', () => {
    it('sets lastIal1AuthenticatedAt for IAL1', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL1 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          lastIal1AuthenticatedAt: new Date('2024-01-15T12:00:00Z'),
        })
      );
    });

    it('sets lastIal2AuthenticatedAt for IAL2', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL2 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          lastIal2AuthenticatedAt: new Date('2024-01-15T12:00:00Z'),
        })
      );
    });

    it('sets verifiedAt for first IAL2 authentication', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL2 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          verifiedAt: new Date('2024-01-15T12:00:00Z'),
        })
      );
    });

    it('does not update verifiedAt if already set', async () => {
      const verifiedIdentity = {
        ...mockIdentity,
        verifiedAt: new Date('2023-01-01T00:00:00Z'),
      };
      const deps = createMockDeps({
        findOrCreateIdentity: vi.fn().mockResolvedValue(verifiedIdentity),
      });
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL2 });

      const updateCall = deps.updateIdentity as ReturnType<typeof vi.fn>;
      const updateData = updateCall.mock.calls[0][1];
      expect(updateData.verifiedAt).toBeUndefined();
    });

    it('sets lastIal2AuthenticatedAt for ialmax (0) when already verified', async () => {
      const verifiedIdentity = {
        ...mockIdentity,
        verifiedAt: new Date('2023-01-01T00:00:00Z'),
      };
      const deps = createMockDeps({
        findOrCreateIdentity: vi.fn().mockResolvedValue(verifiedIdentity),
      });
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: 0 });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          lastIal2AuthenticatedAt: new Date('2024-01-15T12:00:00Z'),
        })
      );
    });
  });

  describe('verified attributes', () => {
    it('combines existing and new verified attributes', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({
        ial: IAL1,
        verifiedAttributes: ['phone', 'address'],
      });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          verifiedAttributes: ['address', 'email', 'phone'],
        })
      );
    });

    it('deduplicates verified attributes', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({
        ial: IAL1,
        verifiedAttributes: ['email', 'phone'],
      });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          verifiedAttributes: ['email', 'phone'],
        })
      );
    });

    it('sorts verified attributes alphabetically', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({
        ial: IAL1,
        verifiedAttributes: ['z_attr', 'a_attr'],
      });

      const updateCall = deps.updateIdentity as ReturnType<typeof vi.fn>;
      const attrs = updateCall.mock.calls[0][1].verifiedAttributes;
      expect(attrs).toEqual(['a_attr', 'email', 'z_attr']);
    });
  });

  describe('optional fields', () => {
    it('sets lastConsentedAt when provided', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);
      const consentDate = new Date('2024-01-10T00:00:00Z');

      await linker.linkIdentity({
        ial: IAL1,
        lastConsentedAt: consentDate,
      });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          lastConsentedAt: consentDate,
        })
      );
    });

    it('clears deletedAt when clearDeletedAt is true', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({
        ial: IAL1,
        clearDeletedAt: true,
      });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          deletedAt: null,
        })
      );
    });

    it('sets code challenge for PKCE', async () => {
      const deps = createMockDeps();
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({
        ial: IAL1,
        codeChallenge: 'challenge123',
      });

      expect(deps.updateIdentity).toHaveBeenCalledWith(
        'identity-1',
        expect.objectContaining({
          codeChallenge: 'challenge123',
        })
      );
    });
  });

  describe('agency identity linking', () => {
    it('calls linkAgencyIdentity when provided', async () => {
      const linkAgencyIdentity = vi.fn();
      const deps = createMockDeps({ linkAgencyIdentity });
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      await linker.linkIdentity({ ial: IAL1 });

      expect(linkAgencyIdentity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    it('works without linkAgencyIdentity', async () => {
      const deps = createMockDeps();
      delete deps.linkAgencyIdentity;
      const linker = new IdentityLinker(mockUser, mockServiceProvider, deps);

      const result = await linker.linkIdentity({ ial: IAL1 });

      expect(result).not.toBeNull();
    });
  });
});

describe('createIdentityLinker', () => {
  it('creates IdentityLinker instance', () => {
    const deps = createMockDeps();
    const linker = createIdentityLinker(mockUser, mockServiceProvider, deps);

    expect(linker).toBeInstanceOf(IdentityLinker);
  });
});
