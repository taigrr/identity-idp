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
