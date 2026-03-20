/**
 * Tests for ID Token module
 * @vitest-environment node
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as jose from 'jose';
import {
  buildIdToken,
  verifyIdToken,
  generateAccessToken,
  generateAuthorizationCode,
} from './id-token';
import { resetKeys, getPrimaryKeyPair, getOidcConfig } from './keys';

describe('ID Token', () => {
  beforeEach(() => {
    resetKeys();
  });

  afterEach(() => {
    resetKeys();
  });

  describe('generateAccessToken', () => {
    test('generates a base64url string', () => {
      const token = generateAccessToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('generates unique tokens', () => {
      const token1 = generateAccessToken();
      const token2 = generateAccessToken();
      expect(token1).not.toBe(token2);
    });

    test('generates sufficiently long tokens', () => {
      const token = generateAccessToken();
      // 32 bytes -> 43 base64url chars
      expect(token.length).toBeGreaterThanOrEqual(42);
    });
  });

  describe('generateAuthorizationCode', () => {
    test('generates a base64url string', () => {
      const code = generateAuthorizationCode();
      expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('generates unique codes', () => {
      const code1 = generateAuthorizationCode();
      const code2 = generateAuthorizationCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('buildIdToken', () => {
    const baseOptions = {
      subject: 'user-uuid-123',
      audience: 'client-id-456',
      nonce: 'random-nonce-value',
      accessToken: generateAccessToken(),
      code: generateAuthorizationCode(),
    };

    test('builds a valid JWT', async () => {
      const { token, ttl } = await buildIdToken(baseOptions);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(ttl).toBeGreaterThan(0);

      // JWT has 3 parts
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    test('token can be verified with public key', async () => {
      const { token } = await buildIdToken(baseOptions);
      const keyPair = await getPrimaryKeyPair();
      const config = getOidcConfig();

      const { payload } = await jose.jwtVerify(token, keyPair.publicKey, {
        issuer: config.issuer,
        audience: baseOptions.audience,
      });

      expect(payload.sub).toBe(baseOptions.subject);
    });

    test('includes required OIDC claims', async () => {
      const { token } = await buildIdToken(baseOptions);
      const decoded = jose.decodeJwt(token);
      const config = getOidcConfig();

      expect(decoded.iss).toBe(config.issuer);
      expect(decoded.sub).toBe(baseOptions.subject);
      expect(decoded.aud).toBe(baseOptions.audience);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.nbf).toBeDefined();
      expect(decoded.jti).toBeDefined();
    });

    test('includes nonce when provided', async () => {
      const { token } = await buildIdToken(baseOptions);
      const decoded = jose.decodeJwt(token);

      expect(decoded.nonce).toBe(baseOptions.nonce);
    });

    test('excludes nonce when not provided', async () => {
      const options = { ...baseOptions, nonce: undefined };
      const { token } = await buildIdToken(options);
      const decoded = jose.decodeJwt(token);

      expect(decoded.nonce).toBeUndefined();
    });

    test('includes at_hash and c_hash', async () => {
      const { token } = await buildIdToken(baseOptions);
      const decoded = jose.decodeJwt(token);

      expect(decoded.at_hash).toBeDefined();
      expect(typeof decoded.at_hash).toBe('string');
      expect(decoded.c_hash).toBeDefined();
      expect(typeof decoded.c_hash).toBe('string');
    });

    test('includes acr when provided', async () => {
      const options = {
        ...baseOptions,
        acr: 'http://idmanagement.gov/ns/assurance/ial/2',
      };
      const { token } = await buildIdToken(options);
      const decoded = jose.decodeJwt(token);

      expect(decoded.acr).toBe(options.acr);
    });

    test('includes user info claims', async () => {
      const options = {
        ...baseOptions,
        userInfo: {
          email: 'test@example.com',
          email_verified: true,
          given_name: 'John',
          family_name: 'Doe',
        },
      };
      const { token } = await buildIdToken(options);
      const decoded = jose.decodeJwt(token);

      expect(decoded.email).toBe('test@example.com');
      expect(decoded.email_verified).toBe(true);
      expect(decoded.given_name).toBe('John');
      expect(decoded.family_name).toBe('Doe');
    });

    test('uses custom TTL when provided', async () => {
      const customTtl = 600;
      const now = new Date();
      const options = { ...baseOptions, ttl: customTtl, now };
      const { token, ttl } = await buildIdToken(options);

      expect(ttl).toBe(customTtl);

      const decoded = jose.decodeJwt(token);
      const expectedExp = Math.floor(now.getTime() / 1000) + customTtl;
      expect(decoded.exp).toBe(expectedExp);
    });

    test('header includes kid', async () => {
      const { token } = await buildIdToken(baseOptions);
      const keyPair = await getPrimaryKeyPair();

      const decoded = jose.decodeProtectedHeader(token);
      expect(decoded.kid).toBe(keyPair.kid);
      expect(decoded.alg).toBe('RS256');
    });
  });

  describe('verifyIdToken', () => {
    const baseOptions = {
      subject: 'user-uuid-123',
      audience: 'client-id-456',
      nonce: 'random-nonce-value',
      accessToken: generateAccessToken(),
      code: generateAuthorizationCode(),
    };

    test('verifies valid token', async () => {
      const { token } = await buildIdToken(baseOptions);
      const payload = await verifyIdToken(token, {
        audience: baseOptions.audience,
      });

      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe(baseOptions.subject);
    });

    test('returns null for invalid token', async () => {
      const payload = await verifyIdToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    test('returns null for wrong audience', async () => {
      const { token } = await buildIdToken(baseOptions);
      const payload = await verifyIdToken(token, {
        audience: 'wrong-audience',
      });

      expect(payload).toBeNull();
    });

    test('rejects expired token by default', async () => {
      const { token } = await buildIdToken({
        ...baseOptions,
        ttl: -100, // Already expired
        now: new Date(Date.now() - 200000), // In the past
      });

      const payload = await verifyIdToken(token, {
        audience: baseOptions.audience,
      });

      expect(payload).toBeNull();
    });

    test('accepts expired token with ignoreExpiration', async () => {
      const pastTime = new Date(Date.now() - 1000000); // 1000 seconds ago
      const { token } = await buildIdToken({
        ...baseOptions,
        ttl: 100,
        now: pastTime,
      });

      const payload = await verifyIdToken(token, {
        audience: baseOptions.audience,
        ignoreExpiration: true,
      });

      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe(baseOptions.subject);
    });
  });

  describe('Token Hash Calculation', () => {
    test('at_hash is derived from access token', async () => {
      const accessToken = generateAccessToken();
      const { token: token1 } = await buildIdToken({
        subject: 'user-1',
        audience: 'client-1',
        accessToken,
        code: generateAuthorizationCode(),
      });

      const { token: token2 } = await buildIdToken({
        subject: 'user-1',
        audience: 'client-1',
        accessToken,
        code: generateAuthorizationCode(),
      });

      const decoded1 = jose.decodeJwt(token1);
      const decoded2 = jose.decodeJwt(token2);

      // Same access token should produce same at_hash
      expect(decoded1.at_hash).toBe(decoded2.at_hash);
    });

    test('c_hash is derived from authorization code', async () => {
      const code = generateAuthorizationCode();
      const { token: token1 } = await buildIdToken({
        subject: 'user-1',
        audience: 'client-1',
        accessToken: generateAccessToken(),
        code,
      });

      const { token: token2 } = await buildIdToken({
        subject: 'user-1',
        audience: 'client-1',
        accessToken: generateAccessToken(),
        code,
      });

      const decoded1 = jose.decodeJwt(token1);
      const decoded2 = jose.decodeJwt(token2);

      // Same code should produce same c_hash
      expect(decoded1.c_hash).toBe(decoded2.c_hash);
    });
  });
});
