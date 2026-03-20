/**
 * AWS KMS Client wrapper with local fallback
 * Mirrors: app/services/encryption/kms_client.rb
 *
 * Supports two modes:
 * - KMS mode: Uses AWS KMS for encryption (production)
 * - Local mode: Uses HMAC-derived key for local development
 *
 * Ciphertext format:
 * - KMS: "KMSc" + JSON array of base64-encoded chunks
 * - Local: "LOCc" + JSON array of base64-encoded chunks
 */

import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import { createHmac } from 'crypto';
import * as aesCipher from './aes-cipher';
import { encode, decode } from './encoding';
import { EncryptionError } from './errors';
import { getConfig } from '../config';

const KEY_TYPE = {
  KMS: 'KMSc',
  LOCAL_KEY: 'LOCc',
} as const;

const MAX_KMS_PLAINTEXT_SIZE = 4096;

export interface EncryptionContext {
  [key: string]: string;
}

export class KmsClientWrapper {
  private kmsKeyId: string;
  private kmsClient: KMSClient | null = null;

  constructor(kmsKeyId?: string) {
    const config = getConfig();
    this.kmsKeyId = kmsKeyId ?? config.awsKmsKeyId;

    if (config.useKms) {
      this.kmsClient = new KMSClient({
        region: config.awsRegion,
        maxAttempts: 5,
      });
    }
  }

  /**
   * Encrypts plaintext using KMS or local key
   */
  async encrypt(
    plaintext: string,
    encryptionContext: EncryptionContext
  ): Promise<string> {
    if (this.kmsClient) {
      return this.encryptKms(plaintext, encryptionContext);
    }
    return this.encryptLocal(plaintext, encryptionContext);
  }

  /**
   * Decrypts ciphertext using KMS or local key
   * Automatically detects encryption type from prefix
   */
  async decrypt(
    ciphertext: string,
    encryptionContext: EncryptionContext
  ): Promise<string> {
    if (this.looksLikeKms(ciphertext)) {
      return this.decryptKms(ciphertext, encryptionContext);
    }
    if (this.looksLikeLocalKey(ciphertext)) {
      return this.decryptLocal(ciphertext, encryptionContext);
    }
    throw new EncryptionError('Unknown ciphertext format');
  }

  private looksLikeKms(ciphertext: string): boolean {
    return ciphertext.startsWith(KEY_TYPE.KMS);
  }

  private looksLikeLocalKey(ciphertext: string): boolean {
    return ciphertext.startsWith(KEY_TYPE.LOCAL_KEY);
  }

  private async encryptKms(
    plaintext: string,
    encryptionContext: EncryptionContext
  ): Promise<string> {
    const chunks = this.chunkPlaintext(plaintext);
    const encryptedChunks: string[] = [];

    for (const chunk of chunks) {
      const encrypted = await this.encryptRawKms(chunk, encryptionContext);
      encryptedChunks.push(encode(encrypted));
    }

    return KEY_TYPE.KMS + JSON.stringify(encryptedChunks);
  }

  private async encryptRawKms(
    plaintext: string,
    encryptionContext: EncryptionContext
  ): Promise<Uint8Array> {
    if (Buffer.byteLength(plaintext) > MAX_KMS_PLAINTEXT_SIZE) {
      throw new EncryptionError('kms plaintext exceeds 4096 bytes');
    }

    if (!this.kmsClient) {
      throw new EncryptionError('KMS client not initialized');
    }

    const command = new EncryptCommand({
      KeyId: this.kmsKeyId,
      Plaintext: Buffer.from(plaintext),
      EncryptionContext: encryptionContext,
    });

    const response = await this.kmsClient.send(command);
    if (!response.CiphertextBlob) {
      throw new EncryptionError('KMS encryption returned no ciphertext');
    }

    return response.CiphertextBlob;
  }

  private async decryptKms(
    ciphertext: string,
    encryptionContext: EncryptionContext
  ): Promise<string> {
    const clippedCiphertext = ciphertext.replace(KEY_TYPE.KMS, '');
    let chunks: string[];

    try {
      chunks = JSON.parse(clippedCiphertext) as string[];
    } catch {
      throw new EncryptionError('Failed to parse KMS ciphertext');
    }

    const decryptedChunks: string[] = [];
    for (const chunk of chunks) {
      const decrypted = await this.decryptRawKms(
        decode(chunk),
        encryptionContext
      );
      decryptedChunks.push(decrypted);
    }

    return decryptedChunks.join('');
  }

  private async decryptRawKms(
    ciphertext: Buffer,
    encryptionContext: EncryptionContext
  ): Promise<string> {
    if (!this.kmsClient) {
      throw new EncryptionError('KMS client not initialized');
    }

    const command = new DecryptCommand({
      CiphertextBlob: ciphertext,
      EncryptionContext: encryptionContext,
    });

    try {
      const response = await this.kmsClient.send(command);
      if (!response.Plaintext) {
        throw new EncryptionError('KMS decryption returned no plaintext');
      }
      return Buffer.from(response.Plaintext).toString('utf8');
    } catch (err) {
      if (
        err instanceof Error &&
        err.name === 'InvalidCiphertextException'
      ) {
        throw new EncryptionError('Aws::KMS::Errors::InvalidCiphertextException');
      }
      throw err;
    }
  }

  private encryptLocal(
    plaintext: string,
    encryptionContext: EncryptionContext
  ): string {
    const chunks = this.chunkPlaintext(plaintext);
    const encryptedChunks: string[] = [];
    const key = this.localEncryptionKey(encryptionContext);

    for (const chunk of chunks) {
      const encrypted = aesCipher.encrypt(chunk, key);
      encryptedChunks.push(encode(Buffer.from(encrypted)));
    }

    return KEY_TYPE.LOCAL_KEY + JSON.stringify(encryptedChunks);
  }

  private decryptLocal(
    ciphertext: string,
    encryptionContext: EncryptionContext
  ): string {
    const clippedCiphertext = ciphertext.replace(KEY_TYPE.LOCAL_KEY, '');
    let chunks: string[];

    try {
      chunks = JSON.parse(clippedCiphertext) as string[];
    } catch {
      throw new EncryptionError('Failed to parse local ciphertext');
    }

    const key = this.localEncryptionKey(encryptionContext);
    const decryptedChunks: string[] = [];

    for (const chunk of chunks) {
      const decrypted = aesCipher.decrypt(decode(chunk).toString('utf8'), key);
      decryptedChunks.push(decrypted);
    }

    return decryptedChunks.join('');
  }

  /**
   * Derives encryption key from password pepper and context
   * Mirrors Rails: HMAC-SHA256 of sorted context keys+values
   */
  private localEncryptionKey(encryptionContext: EncryptionContext): Buffer {
    const config = getConfig();
    const contextParts = [
      ...Object.keys(encryptionContext),
      ...Object.values(encryptionContext),
    ].sort();

    return createHmac('sha256', config.passwordPepper)
      .update(contextParts.join(''))
      .digest();
  }

  /**
   * Chunks plaintext into ~4096 byte chunks
   * Mirrors Rails logic for KMS size limits
   */
  private chunkPlaintext(plaintext: string): string[] {
    const plainSize = Buffer.byteLength(plaintext);
    const numberChunks = Math.floor(plainSize / MAX_KMS_PLAINTEXT_SIZE);
    const chunkSize = Math.floor(plainSize / (1 + numberChunks));

    const chunks: string[] = [];
    let offset = 0;

    while (offset < plaintext.length) {
      chunks.push(plaintext.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }

    return chunks;
  }
}

/**
 * Default KMS client using config.awsKmsKeyId
 */
export function createKmsClient(kmsKeyId?: string): KmsClientWrapper {
  return new KmsClientWrapper(kmsKeyId);
}
