/**
 * Access Token Verifier tests
 * Mirrors: spec/services/access_token_verifier_spec.rb
 */

import { describe, it, expect, vi } from 'vitest';
import {
  verifyAccessToken,
  AccessTokenVerifier,
  type AccessTokenVerifierDeps,
  type ServiceProviderIdentity,
} from './access-token-verifier';

const mockIdentity: ServiceProviderIdentity = {
  id: 'identity-123',
  userId: 'user-456',
  serviceProvider: 'urn:gov:gsa:openidconnect:test',
  accessToken: 'valid-token',
  ial: 2,
  railsSessionId: 'session-789',
};

const createMockDeps = (overrides: Partial<AccessTokenVerifierDeps> = {}): AccessTokenVerifierDeps => ({
  findIdentityByAccessToken: vi.fn().mockResolvedValue(mockIdentity),
  getSessionTtl: vi.fn().mockResolvedValue(3600),
  t: vi.fn((key) => key),
  ...overrides,
});

describe('verifyAccessToken', () => {
  describe('with valid authorization header', () => {
    it('returns success with identity', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.identity).toEqual(mockIdentity);
    });

    it('calls findIdentityByAccessToken with extracted token', async () => {
      const deps = createMockDeps();
      await verifyAccessToken('Bearer my-access-token', deps);

      expect(deps.findIdentityByAccessToken).toHaveBeenCalledWith('my-access-token');
    });

    it('includes extra attributes in result', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.extra.clientId).toBe(mockIdentity.serviceProvider);
      expect(result.extra.ial).toBe(mockIdentity.ial);
      expect(result.extra.integrationErrors.event).toBe('oidc_bearer_token_auth');
    });
  });

  describe('with missing authorization header', () => {
    it('returns error for null header', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken(null, deps);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('no_authorization');
    });

    it('returns error for undefined header', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken(undefined, deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('no_authorization');
    });

    it('returns error for empty string header', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('no_authorization');
    });
  });

  describe('with malformed authorization header', () => {
    it('returns error for non-Bearer scheme', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Basic abc123', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('malformed_authorization');
    });

    it('returns error for Bearer without token', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Bearer', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('malformed_authorization');
    });

    it('returns error for Bearer with empty token', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Bearer ', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('malformed_authorization');
    });
  });

  describe('with invalid access token', () => {
    it('returns error when identity not found', async () => {
      const deps = createMockDeps({
        findIdentityByAccessToken: vi.fn().mockResolvedValue(null),
      });
      const result = await verifyAccessToken('Bearer unknown-token', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('not_found');
      expect(result.identity).toBeNull();
    });

    it('returns error when session TTL is zero', async () => {
      const deps = createMockDeps({
        getSessionTtl: vi.fn().mockResolvedValue(0),
      });
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('not_found');
    });

    it('returns error when session TTL is negative', async () => {
      const deps = createMockDeps({
        getSessionTtl: vi.fn().mockResolvedValue(-1),
      });
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.success).toBe(false);
      expect(result.errors[0].type).toBe('not_found');
    });
  });

  describe('with identity without rails session', () => {
    it('succeeds without checking session TTL', async () => {
      const identityWithoutSession = { ...mockIdentity, railsSessionId: undefined };
      const deps = createMockDeps({
        findIdentityByAccessToken: vi.fn().mockResolvedValue(identityWithoutSession),
      });
      
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.success).toBe(true);
      expect(deps.getSessionTtl).not.toHaveBeenCalled();
    });
  });

  describe('integration errors', () => {
    it('includes error details in integration errors', async () => {
      const deps = createMockDeps({
        findIdentityByAccessToken: vi.fn().mockResolvedValue(null),
        t: vi.fn((key) => `translated: ${key}`),
      });
      
      const result = await verifyAccessToken('Bearer unknown', deps);

      expect(result.extra.integrationErrors.errorDetails).toContain(
        'translated: openid_connect.user_info.errors.not_found'
      );
      expect(result.extra.integrationErrors.errorTypes).toContain('not_found');
    });

    it('includes integration exists flag', async () => {
      const deps = createMockDeps();
      const result = await verifyAccessToken('Bearer valid-token', deps);

      expect(result.extra.integrationErrors.integrationExists).toBe(true);
    });

    it('sets integration exists to false when no identity', async () => {
      const deps = createMockDeps({
        findIdentityByAccessToken: vi.fn().mockResolvedValue(null),
      });
      const result = await verifyAccessToken('Bearer unknown', deps);

      expect(result.extra.integrationErrors.integrationExists).toBe(false);
    });
  });
});

describe('AccessTokenVerifier', () => {
  it('wraps verifyAccessToken in class form', async () => {
    const deps = createMockDeps();
    const verifier = new AccessTokenVerifier(deps);
    
    const result = await verifier.verify('Bearer valid-token');

    expect(result.success).toBe(true);
    expect(result.identity).toEqual(mockIdentity);
  });

  it('handles errors correctly', async () => {
    const deps = createMockDeps();
    const verifier = new AccessTokenVerifier(deps);
    
    const result = await verifier.verify(null);

    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe('no_authorization');
  });
});
