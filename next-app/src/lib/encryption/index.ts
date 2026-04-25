/**
 * Encryption module - TypeScript port of Rails encryption services
 *
 * This module provides encryption compatible with the existing Rails
 * implementation for seamless migration.
 *
 * Components:
 * - AesCipher: AES-256-GCM encryption
 * - KmsClient: AWS KMS wrapper with local fallback
 * - PiiEncryptor: Multi-layer PII encryption (scrypt + AES + KMS)
 * - SessionEncryptor: Session data encryption
 */

export { EncryptionError } from './errors';
export { encode, decode, isValidBase64 } from './encoding';
export * as aesCipher from './aes-cipher';
export { KmsClientWrapper, createKmsClient, type EncryptionContext } from './kms-client';
export { PiiEncryptor, createPiiEncryptor } from './pii-encryptor';
export {
  SessionEncryptor,
  createSessionEncryptor,
  SensitiveKeyError,
  SensitiveValueError,
} from './session-encryptor';

// Convenience functions for simple encrypt/decrypt operations
// These use AES-256-GCM with a local key for development
// In production, use KMS-backed encryption via PiiEncryptor

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Local encryption key - MUST be overridden in production
const getLocalKey = (): Buffer => {
  const key = process.env.LOCAL_ENCRYPTION_KEY || 'local-dev-key-32-characters-ok!';
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
};

/**
 * Simple encrypt function for local development.
 * In production, use PiiEncryptor with KMS.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = getLocalKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Simple decrypt function for local development.
 * In production, use PiiEncryptor with KMS.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = getLocalKey();
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}
