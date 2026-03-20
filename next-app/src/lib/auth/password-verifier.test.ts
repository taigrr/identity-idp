/**
 * Tests for Password Verifier
 * Mirrors: spec/services/encryption/password_verifier_spec.rb
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordVerifier } from './password-verifier';
import { resetConfig } from '../config';

describe('PasswordVerifier', () => {
  beforeEach(() => {
    resetConfig();
    process.env.USE_KMS = 'false';
    process.env.SCRYPT_COST = '1024$8$1$'; // Low cost for fast tests
  });

  const userUuid = 'test-user-uuid-123';

  describe('createDigest', () => {
    it('creates a password digest as JSON', async () => {
      const verifier = new PasswordVerifier();
      const digest = await verifier.createDigest('password123', userUuid);

      const parsed = JSON.parse(digest);
      expect(parsed).toHaveProperty('encrypted_password');
      expect(parsed).toHaveProperty('password_salt');
      expect(parsed).toHaveProperty('password_cost');
    });

    it('creates different digests for same password (random salt)', async () => {
      const verifier = new PasswordVerifier();
      const digest1 = await verifier.createDigest('password123', userUuid);
      const digest2 = await verifier.createDigest('password123', userUuid);

      expect(digest1).not.toBe(digest2);
    });

    it('stores the scrypt cost in the digest', async () => {
      const verifier = new PasswordVerifier();
      const digest = await verifier.createDigest('password123', userUuid);

      const parsed = JSON.parse(digest);
      expect(parsed.password_cost).toBe('1024$8$1$');
    });
  });

  describe('verify', () => {
    it('returns true for correct password', async () => {
      const verifier = new PasswordVerifier();
      const password = 'correctPassword123!';
      const digest = await verifier.createDigest(password, userUuid);

      const result = await verifier.verify(password, { multi_region: digest }, userUuid);
      expect(result).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const verifier = new PasswordVerifier();
      const digest = await verifier.createDigest('correctPassword', userUuid);

      const result = await verifier.verify('wrongPassword', { multi_region: digest }, userUuid);
      expect(result).toBe(false);
    });

    it('returns false for empty digest pair', async () => {
      const verifier = new PasswordVerifier();
      const result = await verifier.verify('password', {}, userUuid);
      expect(result).toBe(false);
    });

    it('handles passwords with special characters', async () => {
      const verifier = new PasswordVerifier();
      const password = 'p@$$w0rd!#$%^&*()_+{}[]|\\:";\'<>?,./~`';
      const digest = await verifier.createDigest(password, userUuid);

      const result = await verifier.verify(password, { multi_region: digest }, userUuid);
      expect(result).toBe(true);
    });

    it('handles unicode passwords', async () => {
      const verifier = new PasswordVerifier();
      const password = '密码123パスワード🔐';
      const digest = await verifier.createDigest(password, userUuid);

      const result = await verifier.verify(password, { multi_region: digest }, userUuid);
      expect(result).toBe(true);
    });

    it('uses single_region if multi_region is not available', async () => {
      const verifier = new PasswordVerifier();
      const password = 'password123';
      const digest = await verifier.createDigest(password, userUuid);

      const result = await verifier.verify(password, { single_region: digest }, userUuid);
      expect(result).toBe(true);
    });

    it('prefers multi_region over single_region', async () => {
      const verifier = new PasswordVerifier();
      const password = 'password123';
      const correctDigest = await verifier.createDigest(password, userUuid);
      const wrongDigest = await verifier.createDigest('wrong', userUuid);

      // Multi-region is correct, single-region is wrong
      const result = await verifier.verify(
        password,
        { multi_region: correctDigest, single_region: wrongDigest },
        userUuid
      );
      expect(result).toBe(true);
    });
  });

  describe('isStaleDigest', () => {
    it('returns false for null/undefined', () => {
      const verifier = new PasswordVerifier();
      expect(verifier.isStaleDigest(null)).toBe(false);
      expect(verifier.isStaleDigest(undefined)).toBe(false);
    });

    it('returns false for current format digest', async () => {
      const verifier = new PasswordVerifier();
      const digest = await verifier.createDigest('password', userUuid);
      expect(verifier.isStaleDigest(digest)).toBe(false);
    });

    it('returns true for legacy UAK format (has encryption_key)', () => {
      const verifier = new PasswordVerifier();
      const legacyDigest = JSON.stringify({
        encrypted_password: 'xxx',
        encryption_key: 'yyy',
        password_salt: 'zzz',
        password_cost: '1024$8$1$',
      });
      expect(verifier.isStaleDigest(legacyDigest)).toBe(true);
    });
  });
});
