/**
 * Tests for AES-256-GCM cipher
 * Mirrors: spec/services/encryption/aes_cipher_spec.rb
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './aes-cipher';
import { EncryptionError } from './errors';

describe('AesCipher', () => {
  const testKey = Buffer.from('this-is-a-test-key-32-characters');

  describe('encrypt', () => {
    it('encrypts plaintext to JSON with iv, ciphertext, and tag', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext, testKey);

      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('ciphertext');
      expect(parsed).toHaveProperty('tag');
    });

    it('produces different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'Hello, World!';
      const encrypted1 = encrypt(plaintext, testKey);
      const encrypted2 = encrypt(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('truncates keys longer than 32 bytes', () => {
      const longKey = Buffer.from('a'.repeat(64));
      const plaintext = 'test';

      // Should not throw
      const encrypted = encrypt(plaintext, longKey);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decrypt', () => {
    it('decrypts ciphertext back to original plaintext', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('handles unicode characters', () => {
      const plaintext = '你好世界 🌍 مرحبا';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('handles empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('handles large plaintext', () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('throws EncryptionError for invalid JSON payload', () => {
      expect(() => decrypt('not-json', testKey)).toThrow(EncryptionError);
      expect(() => decrypt('not-json', testKey)).toThrow(
        'Unable to parse encrypted payload'
      );
    });

    it('throws EncryptionError for tampered ciphertext', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext, testKey);
      const parsed = JSON.parse(encrypted);

      // Tamper with ciphertext
      parsed.ciphertext = 'tampered';
      const tampered = JSON.stringify(parsed);

      expect(() => decrypt(tampered, testKey)).toThrow(EncryptionError);
    });

    it('throws EncryptionError for wrong key', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext, testKey);
      const wrongKey = Buffer.from('wrong-key-that-is-32-characters!');

      expect(() => decrypt(encrypted, wrongKey)).toThrow(EncryptionError);
    });
  });

  describe('round-trip compatibility', () => {
    it('encrypts and decrypts JSON data', () => {
      const data = { name: 'John', age: 30, nested: { foo: 'bar' } };
      const plaintext = JSON.stringify(data);
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(JSON.parse(decrypted)).toEqual(data);
    });
  });
});
