/**
 * Tests for OIDC Keys module
 * @vitest-environment node
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as jose from 'jose';
import {
  generateKeyPair,
  importKeyPair,
  initializeKeys,
  getPrimaryKeyPair,
  getAllKeyPairs,
  generateJwks,
  resetKeys,
  getOidcConfig,
} from './keys';

describe('OIDC Keys', () => {
  beforeEach(() => {
    resetKeys();
  });

  afterEach(() => {
    resetKeys();
  });

  describe('getOidcConfig', () => {
    test('returns default values when env vars not set', () => {
      const config = getOidcConfig();
      expect(config.issuer).toBe('http://localhost:3000');
      expect(config.sessionTimeout).toBe(900);
      expect(config.tokenTtl).toBe(300);
    });
  });

  describe('generateKeyPair', () => {
    test('generates a valid RSA key pair', async () => {
      const keyPair = await generateKeyPair();
      
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.kid).toBeDefined();
      expect(typeof keyPair.kid).toBe('string');
    });

    test('generates unique key IDs', async () => {
      const keyPair1 = await generateKeyPair();
      const keyPair2 = await generateKeyPair();
      
      expect(keyPair1.kid).not.toBe(keyPair2.kid);
    });

    test('key can be used for signing and verification', async () => {
      const keyPair = await generateKeyPair();
      
      const jwt = await new jose.SignJWT({ test: 'data' })
        .setProtectedHeader({ alg: 'RS256', kid: keyPair.kid })
        .sign(keyPair.privateKey);
      
      const { payload } = await jose.jwtVerify(jwt, keyPair.publicKey);
      expect(payload.test).toBe('data');
    });
  });

  describe('importKeyPair', () => {
    let testPrivateKeyPem: string;
    let testPublicKeyPem: string;

    beforeEach(async () => {
      // Generate test PEM keys
      const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
        extractable: true,
      });
      testPrivateKeyPem = await jose.exportPKCS8(privateKey);
      testPublicKeyPem = await jose.exportSPKI(publicKey);
    });

    test('imports key pair from PEM strings', async () => {
      const keyPair = await importKeyPair(testPrivateKeyPem, testPublicKeyPem);
      
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.kid).toBeDefined();
    });

    test('can derive public key from private key', async () => {
      const keyPair = await importKeyPair(testPrivateKeyPem);
      
      expect(keyPair.publicKey).toBeDefined();
      
      // Verify the derived public key works
      const jwt = await new jose.SignJWT({ test: 'data' })
        .setProtectedHeader({ alg: 'RS256' })
        .sign(keyPair.privateKey);
      
      const { payload } = await jose.jwtVerify(jwt, keyPair.publicKey);
      expect(payload.test).toBe('data');
    });

    test('imported keys can sign and verify', async () => {
      const keyPair = await importKeyPair(testPrivateKeyPem, testPublicKeyPem);
      
      const jwt = await new jose.SignJWT({ sub: '123' })
        .setProtectedHeader({ alg: 'RS256', kid: keyPair.kid })
        .sign(keyPair.privateKey);
      
      const { payload } = await jose.jwtVerify(jwt, keyPair.publicKey);
      expect(payload.sub).toBe('123');
    });
  });

  describe('initializeKeys', () => {
    test('generates keys when no env vars set', async () => {
      await initializeKeys();
      
      const keyPair = await getPrimaryKeyPair();
      expect(keyPair).toBeDefined();
      expect(keyPair.kid).toBeDefined();
    });
  });

  describe('getPrimaryKeyPair', () => {
    test('returns consistent key pair', async () => {
      const keyPair1 = await getPrimaryKeyPair();
      const keyPair2 = await getPrimaryKeyPair();
      
      expect(keyPair1.kid).toBe(keyPair2.kid);
    });

    test('auto-initializes if not initialized', async () => {
      resetKeys();
      const keyPair = await getPrimaryKeyPair();
      expect(keyPair).toBeDefined();
    });
  });

  describe('getAllKeyPairs', () => {
    test('returns array of key pairs', async () => {
      const pairs = await getAllKeyPairs();
      
      expect(Array.isArray(pairs)).toBe(true);
      expect(pairs.length).toBeGreaterThan(0);
    });

    test('includes primary key pair', async () => {
      const primary = await getPrimaryKeyPair();
      const all = await getAllKeyPairs();
      
      const found = all.find((p) => p.kid === primary.kid);
      expect(found).toBeDefined();
    });
  });

  describe('generateJwks', () => {
    test('generates valid JWKS', async () => {
      const jwks = await generateJwks();
      
      expect(jwks.keys).toBeDefined();
      expect(Array.isArray(jwks.keys)).toBe(true);
      expect(jwks.keys.length).toBeGreaterThan(0);
    });

    test('JWKS contains required fields', async () => {
      const jwks = await generateJwks();
      const key = jwks.keys[0];
      
      expect(key.kty).toBe('RSA');
      expect(key.alg).toBe('RS256');
      expect(key.use).toBe('sig');
      expect(key.kid).toBeDefined();
      expect(key.n).toBeDefined(); // RSA modulus
      expect(key.e).toBeDefined(); // RSA exponent
    });

    test('JWKS does not contain private key components', async () => {
      const jwks = await generateJwks();
      const key = jwks.keys[0];
      
      expect(key.d).toBeUndefined();
      expect(key.p).toBeUndefined();
      expect(key.q).toBeUndefined();
      expect(key.dp).toBeUndefined();
      expect(key.dq).toBeUndefined();
      expect(key.qi).toBeUndefined();
    });

    test('JWKS kid matches primary key pair', async () => {
      const primary = await getPrimaryKeyPair();
      const jwks = await generateJwks();
      
      const key = jwks.keys.find((k) => k.kid === primary.kid);
      expect(key).toBeDefined();
    });
  });

  describe('resetKeys', () => {
    test('resets key state', async () => {
      const keyPair1 = await getPrimaryKeyPair();
      
      resetKeys();
      
      const keyPair2 = await getPrimaryKeyPair();
      
      // After reset, a new key pair is generated
      expect(keyPair1.kid).not.toBe(keyPair2.kid);
    });
  });
});
