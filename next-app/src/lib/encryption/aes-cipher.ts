/**
 * AES-256-GCM cipher implementation
 * Mirrors: app/services/encryption/aes_cipher.rb
 *
 * Used for encrypting PII and session data with authenticated encryption.
 * The auth_data is set to 'PII' to match the Rails implementation.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { encode, decode } from './encoding';
import { EncryptionError } from './errors';

const ALGORITHM = 'aes-256-gcm';
const AUTH_DATA = 'PII';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  tag: string;
}

/**
 * Encrypts plaintext using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param key - The encryption key (will be truncated to 32 bytes)
 * @returns JSON string with { iv, ciphertext, tag }
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const truncatedKey = key.subarray(0, 32);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, truncatedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  cipher.setAAD(Buffer.from(AUTH_DATA));

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: encode(iv),
    ciphertext: encode(ciphertext),
    tag: encode(tag),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts AES-256-GCM encrypted payload
 * @param payloadJson - JSON string with { iv, ciphertext, tag }
 * @param key - The decryption key (will be truncated to 32 bytes)
 * @returns Decrypted plaintext
 */
export function decrypt(payloadJson: string, key: Buffer): string {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(payloadJson) as EncryptedPayload;
  } catch {
    throw new EncryptionError('Unable to parse encrypted payload');
  }

  const truncatedKey = key.subarray(0, 32);
  const iv = decode(payload.iv);
  const ciphertext = decode(payload.ciphertext);
  const tag = decode(payload.tag);

  try {
    const decipher = createDecipheriv(ALGORITHM, truncatedKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAAD(Buffer.from(AUTH_DATA));
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    throw new EncryptionError(
      `failed to decipher payload: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
