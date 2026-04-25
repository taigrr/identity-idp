/**
 * Tests for OIDC Authorization Form Validator
 */

import { describe, it, expect } from 'vitest';
import {
  validateAuthorizeForm,
  buildSuccessRedirectUri,
  addParamsToUri,
  type ServiceProviderConfig,
  type AuthorizeParams,
} from './authorize-form';
import { ACR_VALUES } from './constants';

// Mock service provider lookup
const mockServiceProviders: Record<string, ServiceProviderConfig> = {
  'urn:test:sp': {
    issuer: 'urn:test:sp',
    active: true,
    ial: 1,
    pkce: true,
    allowPromptLogin: true,
    redirectUris: ['https://example.com/callback'],
    allowIalMax: false,
    facialMatchAllowed: false,
    verifiedWithinAllowed: false,
  },
  'urn:test:sp:ial2': {
    issuer: 'urn:test:sp:ial2',
    active: true,
    ial: 2,
    pkce: true,
    allowPromptLogin: true,
    redirectUris: ['https://example.com/callback', 'https://example.com/alt-callback'],
    allowIalMax: true,
    facialMatchAllowed: true,
    verifiedWithinAllowed: true,
  },
  'urn:test:sp:inactive': {
    issuer: 'urn:test:sp:inactive',
    active: false,
    ial: 1,
    pkce: true,
    allowPromptLogin: false,
    redirectUris: ['https://example.com/callback'],
    allowIalMax: false,
    facialMatchAllowed: false,
    verifiedWithinAllowed: false,
  },
};

function getServiceProvider(clientId: string): ServiceProviderConfig | null {
  return mockServiceProviders[clientId] || null;
}

function validParams(overrides: Partial<AuthorizeParams> = {}): AuthorizeParams {
  return {
    client_id: 'urn:test:sp',
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'openid email',
    state: 'a'.repeat(22),
    nonce: 'b'.repeat(22),
    acr_values: ACR_VALUES.IAL1,
    code_challenge: 'challenge123',
    code_challenge_method: 'S256',
    prompt: 'select_account',
    ...overrides,
  };
}

describe('validateAuthorizeForm', () => {
  describe('valid requests', () => {
    it('accepts a valid IAL1 authorization request', () => {
      const result = validateAuthorizeForm(validParams(), getServiceProvider);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.params.clientId).toBe('urn:test:sp');
      expect(result.params.redirectUri).toBe('https://example.com/callback');
      expect(result.params.scope).toContain('openid');
      expect(result.params.scope).toContain('email');
    });

    it('accepts a valid IAL2 authorization request', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: ACR_VALUES.IAL2,
          scope: 'openid email profile address',
        }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
      expect(result.params.identityProofingRequested).toBe(true);
      expect(result.params.ialValues).toContain(ACR_VALUES.IAL2);
    });

    it('accepts prompt=login when allowed', () => {
      const result = validateAuthorizeForm(
        validParams({ prompt: 'login' }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
      expect(result.params.prompt).toBe('login');
    });

    it('parses multiple ACR values', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: `${ACR_VALUES.IAL2} ${ACR_VALUES.AAL2}`,
        }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
      expect(result.params.acrValues).toContain(ACR_VALUES.IAL2);
      expect(result.params.acrValues).toContain(ACR_VALUES.AAL2);
      expect(result.params.ialValues).toContain(ACR_VALUES.IAL2);
      expect(result.params.aalValues).toContain(ACR_VALUES.AAL2);
    });

    it('filters invalid scope values', () => {
      const result = validateAuthorizeForm(
        validParams({ scope: 'openid email invalid_scope' }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
      expect(result.params.scope).toContain('openid');
      expect(result.params.scope).toContain('email');
      expect(result.params.scope).not.toContain('invalid_scope');
    });
  });

  describe('client_id validation', () => {
    it('rejects missing client_id', () => {
      const result = validateAuthorizeForm(
        validParams({ client_id: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.client_id).toBeDefined();
    });

    it('rejects unknown client_id', () => {
      const result = validateAuthorizeForm(
        validParams({ client_id: 'urn:unknown:sp' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.client_id).toContain('Invalid');
    });
  });

  describe('redirect_uri validation', () => {
    it('rejects missing redirect_uri', () => {
      const result = validateAuthorizeForm(
        validParams({ redirect_uri: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.redirect_uri).toBeDefined();
    });

    it('rejects redirect_uri not in allowed list', () => {
      const result = validateAuthorizeForm(
        validParams({ redirect_uri: 'https://evil.com/callback' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.redirect_uri).toContain('not in the allowed list');
    });

    it('accepts redirect_uri from allowed list', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          redirect_uri: 'https://example.com/alt-callback',
          acr_values: ACR_VALUES.IAL1,
        }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('state and nonce validation', () => {
    it('rejects missing state', () => {
      const result = validateAuthorizeForm(
        validParams({ state: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.state).toBeDefined();
    });

    it('rejects short state', () => {
      const result = validateAuthorizeForm(
        validParams({ state: 'short' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.state).toContain('at least 22');
    });

    it('rejects missing nonce', () => {
      const result = validateAuthorizeForm(
        validParams({ nonce: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.nonce).toBeDefined();
    });

    it('rejects short nonce', () => {
      const result = validateAuthorizeForm(
        validParams({ nonce: 'short' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.nonce).toContain('at least 22');
    });
  });

  describe('acr_values validation', () => {
    it('rejects missing acr_values', () => {
      const result = validateAuthorizeForm(
        validParams({ acr_values: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.acr_values).toBeDefined();
    });

    it('rejects all invalid acr_values', () => {
      const result = validateAuthorizeForm(
        validParams({ acr_values: 'invalid_acr' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.acr_values).toContain('No valid');
    });

    it('rejects IAL2 request from IAL1 service provider', () => {
      const result = validateAuthorizeForm(
        validParams({ acr_values: ACR_VALUES.IAL2 }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.acr_values).toContain('not authorized');
    });

    it('accepts IAL2 request from IAL2 service provider', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: ACR_VALUES.IAL2,
        }),
        getServiceProvider,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('scope validation', () => {
    it('rejects missing scope', () => {
      const result = validateAuthorizeForm(
        validParams({ scope: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.scope).toBeDefined();
    });

    it('rejects all invalid scopes', () => {
      const result = validateAuthorizeForm(
        validParams({ scope: 'invalid_scope another_invalid' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.scope).toContain('No valid scope');
    });

    it('restricts IAL2 scopes for IAL1 requests', () => {
      const result = validateAuthorizeForm(
        validParams({ scope: 'openid address' }), // address is IAL2 only
        getServiceProvider,
      );

      // Scope should be filtered to only valid IAL1 scopes
      expect(result.params.scope).toContain('openid');
      expect(result.params.scope).not.toContain('address');
    });
  });

  describe('response_type validation', () => {
    it('rejects invalid response_type', () => {
      const result = validateAuthorizeForm(
        validParams({ response_type: 'token' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.response_type).toContain('must be code');
    });
  });

  describe('prompt validation', () => {
    it('rejects invalid prompt value', () => {
      const result = validateAuthorizeForm(
        validParams({ prompt: 'consent' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.prompt).toBeDefined();
    });

    it('rejects prompt=login when not allowed', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:inactive', // This one doesn't allow prompt=login
          prompt: 'login',
        }),
        (id) => ({ ...mockServiceProviders[id]!, active: true, allowPromptLogin: false }),
      );

      expect(result.success).toBe(false);
      expect(result.errors.prompt).toContain('not allowed');
    });

    it('defaults to select_account when not provided', () => {
      const result = validateAuthorizeForm(
        validParams({ prompt: undefined }),
        getServiceProvider,
      );

      expect(result.params.prompt).toBe('select_account');
    });
  });

  describe('code_challenge_method validation', () => {
    it('requires code_challenge_method when code_challenge is provided', () => {
      const result = validateAuthorizeForm(
        validParams({ code_challenge: 'challenge', code_challenge_method: undefined }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.code_challenge_method).toBeDefined();
    });

    it('rejects invalid code_challenge_method', () => {
      const result = validateAuthorizeForm(
        validParams({ code_challenge: 'challenge', code_challenge_method: 'plain' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errors.code_challenge_method).toContain('S256');
    });
  });

  describe('error redirect URI', () => {
    it('builds error redirect URI when redirect_uri is valid', () => {
      const result = validateAuthorizeForm(
        validParams({ state: 'short' }), // Invalid state
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errorRedirectUri).toBeDefined();
      expect(result.errorRedirectUri).toContain('error=invalid_request');
      expect(result.errorRedirectUri).toContain('error_description=');
    });

    it('does not build error redirect URI when redirect_uri is invalid', () => {
      const result = validateAuthorizeForm(
        validParams({ redirect_uri: 'https://evil.com/callback' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errorRedirectUri).toBeUndefined();
    });

    it('does not build error redirect URI when client_id is invalid', () => {
      const result = validateAuthorizeForm(
        validParams({ client_id: 'unknown' }),
        getServiceProvider,
      );

      expect(result.success).toBe(false);
      expect(result.errorRedirectUri).toBeUndefined();
    });
  });

  describe('parsed params', () => {
    it('correctly identifies IAL1 requests', () => {
      const result = validateAuthorizeForm(
        validParams({ acr_values: ACR_VALUES.IAL1 }),
        getServiceProvider,
      );

      expect(result.params.identityProofingRequested).toBe(false);
      expect(result.params.ialMaxRequested).toBe(false);
    });

    it('correctly identifies IAL2 requests', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: ACR_VALUES.IAL2,
        }),
        getServiceProvider,
      );

      expect(result.params.identityProofingRequested).toBe(true);
      expect(result.params.ialMaxRequested).toBe(false);
    });

    it('correctly identifies IAL MAX requests', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: ACR_VALUES.IAL_MAX,
        }),
        getServiceProvider,
      );

      expect(result.params.identityProofingRequested).toBe(false);
      expect(result.params.ialMaxRequested).toBe(true);
    });

    it('calculates requested AAL value', () => {
      const result = validateAuthorizeForm(
        validParams({
          client_id: 'urn:test:sp:ial2',
          acr_values: `${ACR_VALUES.IAL1} ${ACR_VALUES.AAL2}`,
        }),
        getServiceProvider,
      );

      expect(result.params.requestedAalValue).toBe(ACR_VALUES.AAL2);
    });

    it('defaults to DEFAULT_AAL when no AAL specified', () => {
      const result = validateAuthorizeForm(
        validParams({ acr_values: ACR_VALUES.IAL1 }),
        getServiceProvider,
      );

      expect(result.params.requestedAalValue).toBe(ACR_VALUES.DEFAULT_AAL);
    });
  });
});

describe('buildSuccessRedirectUri', () => {
  it('adds code and state to redirect URI', () => {
    const result = buildSuccessRedirectUri(
      'https://example.com/callback',
      'auth-code-123',
      'state-456',
    );

    expect(result).toContain('code=auth-code-123');
    expect(result).toContain('state=state-456');
  });

  it('handles existing query parameters', () => {
    const result = buildSuccessRedirectUri(
      'https://example.com/callback?existing=param',
      'auth-code-123',
      'state-456',
    );

    expect(result).toContain('existing=param');
    expect(result).toContain('code=auth-code-123');
    expect(result).toContain('state=state-456');
  });
});

describe('addParamsToUri', () => {
  it('adds parameters to URI', () => {
    const result = addParamsToUri('https://example.com/callback', {
      foo: 'bar',
      baz: 'qux',
    });

    expect(result).toContain('foo=bar');
    expect(result).toContain('baz=qux');
  });

  it('handles special characters', () => {
    const result = addParamsToUri('https://example.com/callback', {
      message: 'hello world',
    });

    expect(result).toContain('message=hello+world');
  });
});
