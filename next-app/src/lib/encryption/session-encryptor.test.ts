/**
 * Tests for SessionEncryptor
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config
vi.mock('../config', () => ({
  getConfig: vi.fn().mockReturnValue({
    sessionEncryptionKey: 'test-encryption-key-32-bytes-long!!',
    awsKmsSessionKeyId: 'test-kms-key-id',
    sessionEncryptorAlertEnabled: false,
  }),
}));

// Mock KMS client
vi.mock('./kms-client', () => ({
  KmsClientWrapper: class MockKmsClient {
    encrypt = vi.fn().mockResolvedValue('encrypted-by-kms');
    decrypt = vi.fn().mockResolvedValue('{"decrypted": true}');
  },
}));

// Mock AES cipher to avoid actual encryption in tests
vi.mock('./aes-cipher', () => ({
  encrypt: vi.fn().mockReturnValue('aes-encrypted'),
  decrypt: vi.fn().mockReturnValue('{"key": "value"}'),
}));

import {
  SessionEncryptor,
  SensitiveKeyError,
  createSessionEncryptor,
} from './session-encryptor';

describe('SessionEncryptor', () => {
  let encryptor: SessionEncryptor;

  beforeEach(() => {
    vi.clearAllMocks();
    encryptor = new SessionEncryptor();
  });

  describe('dump', () => {
    test('encrypts session data to buffer', async () => {
      const session = { userId: 1, deviceId: 'device-123' };
      const result = await encryptor.dump(session);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    test('handles empty session', async () => {
      const session = {};
      const result = await encryptor.dump(session);

      expect(result).toBeInstanceOf(Buffer);
    });

    test('throws on sensitive keys when alerting is disabled', async () => {
      const { getConfig } = await import('../config');
      vi.mocked(getConfig).mockReturnValue({
        sessionEncryptionKey: 'test-encryption-key-32-bytes-long!!',
        awsKmsSessionKeyId: 'test-kms-key-id',
        sessionEncryptorAlertEnabled: false,
      } as ReturnType<typeof getConfig>);

      const session = { ssn: '123-45-6789' };
      
      await expect(encryptor.dump(session)).rejects.toThrow(SensitiveKeyError);
    });
  });

  describe('load', () => {
    test('requires messagepack encoded buffer', async () => {
      // Create a mock MessagePack buffer with expected structure
      const msgpack = await import('msgpack-lite');
      const payload = {
        v: 'v3',
        t: 'aes-encrypted',
        c: 0,
      };
      const buffer = msgpack.encode(payload);

      // This will use the mocked decrypt
      const result = await encryptor.load(buffer);
      expect(result).toHaveProperty('key', 'value');
    });
  });

  describe('kmsEncrypt', () => {
    test('encrypts text and returns base64', async () => {
      const result = await encryptor.kmsEncrypt('sensitive-data');
      expect(typeof result).toBe('string');
    });
  });

  describe('kmsDecrypt', () => {
    test('decrypts base64 encoded text', async () => {
      const result = await encryptor.kmsDecrypt(
        Buffer.from('encrypted-data').toString('base64')
      );
      expect(result).toBe('{"decrypted": true}');
    });
  });
});

describe('createSessionEncryptor', () => {
  test('creates new encryptor instance', () => {
    const encryptor = createSessionEncryptor();
    expect(encryptor).toBeInstanceOf(SessionEncryptor);
  });
});

describe('Sensitive Keys', () => {
  const sensitiveKeys = [
    'first_name',
    'last_name',
    'ssn',
    'dob',
    'phone_number',
    'email',
    'password',
    'personal_key',
    'address1',
    'city',
    'state',
    'zipcode',
  ];

  test.each(sensitiveKeys)('detects %s as sensitive', async (key) => {
    const encryptor = new SessionEncryptor();
    const session = { [key]: 'value' };

    await expect(encryptor.dump(session)).rejects.toThrow(SensitiveKeyError);
  });

  test('allows non-sensitive keys', async () => {
    const encryptor = new SessionEncryptor();
    const session = {
      userId: 1,
      deviceId: 'device-123',
      signInFlow: 'sign_in',
      mfaVerified: true,
    };

    const result = await encryptor.dump(session);
    expect(result).toBeInstanceOf(Buffer);
  });
});
