/**
 * Tests for KMS Client (local mode only - no AWS mocking)
 * Mirrors: spec/services/encryption/kms_client_spec.rb
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KmsClientWrapper } from './kms-client';
import { resetConfig } from '../config';

describe('KmsClientWrapper (local mode)', () => {
  beforeEach(() => {
    resetConfig();
    // Ensure we're in local mode
    process.env.USE_KMS = 'false';
  });

  const context = { user_uuid: 'test-uuid-123', context: 'test' };

  describe('encrypt/decrypt with local key', () => {
    it('encrypts and decrypts plaintext', async () => {
      const client = new KmsClientWrapper();
      const plaintext = 'Hello, World!';

      const encrypted = await client.encrypt(plaintext, context);
      const decrypted = await client.decrypt(encrypted, context);

      expect(decrypted).toBe(plaintext);
    });

    it('produces ciphertext starting with LOCc prefix', async () => {
      const client = new KmsClientWrapper();
      const plaintext = 'test';

      const encrypted = await client.encrypt(plaintext, context);
      expect(encrypted.startsWith('LOCc')).toBe(true);
    });

    it('handles unicode characters', async () => {
      const client = new KmsClientWrapper();
      const plaintext = '日本語テスト 🎉';

      const encrypted = await client.encrypt(plaintext, context);
      const decrypted = await client.decrypt(encrypted, context);

      expect(decrypted).toBe(plaintext);
    });

    it('handles large plaintext with chunking', async () => {
      const client = new KmsClientWrapper();
      // Create plaintext larger than 4096 bytes
      const plaintext = 'x'.repeat(10000);

      const encrypted = await client.encrypt(plaintext, context);
      const decrypted = await client.decrypt(encrypted, context);

      expect(decrypted).toBe(plaintext);
    });

    it('produces different ciphertext with different context', async () => {
      const client = new KmsClientWrapper();
      const plaintext = 'test';

      const context1 = { user_uuid: 'user-1', context: 'test' };
      const context2 = { user_uuid: 'user-2', context: 'test' };

      const encrypted1 = await client.encrypt(plaintext, context1);
      const encrypted2 = await client.encrypt(plaintext, context2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('fails to decrypt with wrong context', async () => {
      const client = new KmsClientWrapper();
      const plaintext = 'test';

      const encrypted = await client.encrypt(plaintext, context);

      // Decrypt with different context should fail (different derived key)
      const wrongContext = { user_uuid: 'wrong-uuid', context: 'test' };

      await expect(client.decrypt(encrypted, wrongContext)).rejects.toThrow();
    });
  });

  describe('ciphertext format detection', () => {
    it('detects LOCc prefix for local encryption', async () => {
      const client = new KmsClientWrapper();
      const encrypted = await client.encrypt('test', context);

      expect(encrypted.startsWith('LOCc')).toBe(true);
    });
  });
});
