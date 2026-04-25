/**
 * Tests for WebAuthn Service
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { AuthenticatorTransportFuture, RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

// Mock @simplewebauthn/server
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn().mockResolvedValue({
    challenge: 'test-challenge-base64url',
    rp: { name: 'Login.gov', id: 'localhost' },
    user: { id: 'user-id', name: 'test@example.com', displayName: 'test@example.com' },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    timeout: 60000,
    attestation: 'none',
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  }),
  verifyRegistrationResponse: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: new Uint8Array([1, 2, 3, 4]),
        publicKey: new Uint8Array([5, 6, 7, 8]),
        counter: 0,
      },
      credentialDeviceType: 'singleDevice',
    },
  }),
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: 'test-auth-challenge-base64url',
    rpId: 'localhost',
    allowCredentials: [],
    timeout: 60000,
    userVerification: 'preferred',
  }),
  verifyAuthenticationResponse: vi.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 1,
      credentialId: new Uint8Array([1, 2, 3, 4]),
    },
  }),
}));

import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication,
  type WebAuthnCredential,
} from './webauthn';

describe('WebAuthn Service', () => {
  const mockCredential: WebAuthnCredential = {
    id: 1,
    userId: 1,
    credentialId: 'AQIDBA',
    credentialPublicKey: 'BQYHCAk',
    counter: 0,
    transports: ['usb', 'nfc'],
    name: 'Security Key',
    platformAuthenticator: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('generateWebAuthnRegistrationOptions', () => {
    test('generates options for new user', async () => {
      const result = await generateWebAuthnRegistrationOptions(
        'user-uuid-123',
        'test@example.com',
        []
      );

      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('options');
      expect(result.options.rp.name).toBe('Login.gov');
    });

    test('excludes existing credentials', async () => {
      const result = await generateWebAuthnRegistrationOptions(
        'user-uuid-123',
        'test@example.com',
        [mockCredential]
      );

      expect(result).toHaveProperty('challenge');
    });

    test('supports platform authenticator option', async () => {
      const { generateRegistrationOptions } = await import('@simplewebauthn/server');
      vi.mocked(generateRegistrationOptions).mockResolvedValueOnce({
        challenge: 'test-challenge-base64url',
        rp: { name: 'Login.gov', id: 'localhost' },
        user: { id: 'user-id', name: 'test@example.com', displayName: 'test@example.com' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        timeout: 60000,
        attestation: 'none',
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
      });
      
      const result = await generateWebAuthnRegistrationOptions(
        'user-uuid-123',
        'test@example.com',
        [],
        true // platformAuthenticator
      );

      expect(result.options.authenticatorSelection?.authenticatorAttachment).toBe('platform');
    });
  });

  describe('verifyWebAuthnRegistration', () => {
    const mockResponse: RegistrationResponseJSON = {
      id: 'credential-id',
      rawId: 'credential-id',
      response: {
        clientDataJSON: 'mock-client-data',
        attestationObject: 'mock-attestation',
        transports: ['usb', 'nfc'] as AuthenticatorTransportFuture[],
      },
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'cross-platform',
    };

    test('returns credential data on success', async () => {
      const result = await verifyWebAuthnRegistration(
        mockResponse,
        'test-challenge'
      );

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('credentialId');
      expect(result).toHaveProperty('credentialPublicKey');
      expect(result).toHaveProperty('counter');
      expect(result).toHaveProperty('transports');
    });

    test('returns null on verification failure', async () => {
      const { verifyRegistrationResponse } = await import('@simplewebauthn/server');
      vi.mocked(verifyRegistrationResponse).mockResolvedValueOnce({
        verified: false,
        registrationInfo: undefined,
      });

      const result = await verifyWebAuthnRegistration(
        mockResponse,
        'test-challenge'
      );

      expect(result).toBeNull();
    });
  });

  describe('generateWebAuthnAuthenticationOptions', () => {
    test('generates options for existing credentials', async () => {
      const result = await generateWebAuthnAuthenticationOptions([mockCredential]);

      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('options');
    });

    test('works with empty credentials (roaming)', async () => {
      const result = await generateWebAuthnAuthenticationOptions([]);

      expect(result).toHaveProperty('challenge');
    });
  });

  describe('verifyWebAuthnAuthentication', () => {
    const mockAuthResponse = {
      id: 'AQIDBA',
      rawId: 'AQIDBA',
      response: {
        clientDataJSON: 'mock-client-data',
        authenticatorData: 'mock-auth-data',
        signature: 'mock-signature',
      },
      type: 'public-key' as const,
      clientExtensionResults: {},
      authenticatorAttachment: 'cross-platform' as const,
    };

    test('returns credential and new counter on success', async () => {
      const result = await verifyWebAuthnAuthentication(
        mockAuthResponse,
        'test-challenge',
        [mockCredential]
      );

      expect(result).not.toBeNull();
      expect(result?.credential).toEqual(mockCredential);
      expect(result?.newCounter).toBe(1);
    });

    test('returns null when credential not found', async () => {
      const result = await verifyWebAuthnAuthentication(
        { ...mockAuthResponse, id: 'unknown-credential' },
        'test-challenge',
        [mockCredential]
      );

      expect(result).toBeNull();
    });

    test('returns null on verification failure', async () => {
      const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
      vi.mocked(verifyAuthenticationResponse).mockResolvedValueOnce({
        verified: false,
        authenticationInfo: {
          newCounter: 0,
          credentialID: 'AQIDBA',
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: 'http://localhost:3000',
          rpID: 'localhost',
          userVerified: true,
        },
      });

      const result = await verifyWebAuthnAuthentication(
        mockAuthResponse,
        'test-challenge',
        [mockCredential]
      );

      expect(result).toBeNull();
    });
  });
});

describe('WebAuthnCredential interface', () => {
  test('has all required fields', () => {
    const credential: WebAuthnCredential = {
      id: 1,
      userId: 1,
      credentialId: 'base64url-credential-id',
      credentialPublicKey: 'base64-public-key',
      counter: 0,
      transports: ['usb'],
      name: 'My Security Key',
      platformAuthenticator: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(credential.id).toBe(1);
    expect(credential.transports).toContain('usb');
    expect(credential.platformAuthenticator).toBe(false);
  });
});
