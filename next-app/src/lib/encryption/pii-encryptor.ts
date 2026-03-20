/**
 * PII Encryptor - encrypts sensitive user data
 * Mirrors: app/services/encryption/encryptors/pii_encryptor.rb
 *
 * Uses layered encryption:
 * 1. scrypt key derivation from password + salt
 * 2. AES-256-GCM encryption with derived key
 * 3. KMS envelope encryption of the AES ciphertext
 */

import { randomBytes, createHash } from 'crypto';
import { scrypt } from 'scrypt-js';
import * as aesCipher from './aes-cipher';
import { KmsClientWrapper } from './kms-client';
import { encode, decode, isValidBase64 } from './encoding';
import { EncryptionError } from './errors';
import { getConfig } from '../config';

interface Ciphertext {
  encrypted_data: string;
  salt: string;
  cost: string;
}

export class PiiEncryptor {
  private password: string;
  private multiRegionKmsClient: KmsClientWrapper;

  constructor(password: string) {
    const config = getConfig();
    this.password = password;
    this.multiRegionKmsClient = new KmsClientWrapper(
      config.awsKmsMultiRegionKeyId
    );
  }

  /**
   * Encrypts plaintext PII data
   * @param plaintext - The PII to encrypt
   * @param userUuid - Optional user UUID for KMS context
   */
  async encrypt(plaintext: string, userUuid?: string): Promise<string> {
    const config = getConfig();
    const salt = randomBytes(32).toString('hex');
    const cost = config.scryptCost;

    const aesEncryptionKey = await this.scryptPasswordDigest(salt, cost);
    const aesEncryptedCiphertext = aesCipher.encrypt(plaintext, aesEncryptionKey);

    const kmsEncryptedCiphertext = await this.multiRegionKmsClient.encrypt(
      aesEncryptedCiphertext,
      this.kmsEncryptionContext(userUuid)
    );

    const ciphertext: Ciphertext = {
      encrypted_data: encode(Buffer.from(kmsEncryptedCiphertext)),
      salt,
      cost,
    };

    return JSON.stringify(ciphertext);
  }

  /**
   * Decrypts PII data
   * @param ciphertextString - The encrypted PII JSON
   * @param userUuid - Optional user UUID for KMS context
   */
  async decrypt(ciphertextString: string, userUuid?: string): Promise<string> {
    const ciphertext = this.parseCiphertext(ciphertextString);

    const aesEncryptedCiphertext = await this.multiRegionKmsClient.decrypt(
      decode(ciphertext.encrypted_data).toString('utf8'),
      this.kmsEncryptionContext(userUuid)
    );

    const aesEncryptionKey = await this.scryptPasswordDigest(
      ciphertext.salt,
      ciphertext.cost
    );

    return aesCipher.decrypt(aesEncryptedCiphertext, aesEncryptionKey);
  }

  private parseCiphertext(ciphertextString: string): Ciphertext {
    let parsed: Ciphertext;
    try {
      parsed = JSON.parse(ciphertextString) as Ciphertext;
    } catch {
      throw new EncryptionError('ciphertext is not valid JSON');
    }

    if (!isValidBase64(parsed.encrypted_data)) {
      throw new EncryptionError('ciphertext invalid');
    }

    return parsed;
  }

  private kmsEncryptionContext(userUuid?: string): Record<string, string> {
    return {
      context: 'pii-encryption',
      user_uuid: userUuid ?? '',
    };
  }

  /**
   * Derives encryption key using scrypt
   * Mirrors Rails SCrypt::Engine.hash_secret
   */
  private async scryptPasswordDigest(
    salt: string,
    cost: string
  ): Promise<Buffer> {
    const scryptSalt = cost + createHash('sha256').update(salt).digest('hex');

    // Parse scrypt cost format: "N$r$p$" (e.g., "10000$8$1$")
    const [nStr, rStr, pStr] = cost.split('$');
    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);

    const passwordBuffer = Buffer.from(this.password, 'utf8');
    const saltBuffer = Buffer.from(scryptSalt, 'utf8');

    // scrypt-js returns Uint8Array
    const derived = await scrypt(passwordBuffer, saltBuffer, N, r, p, 32);

    return Buffer.from(derived);
  }
}

/**
 * Create PII encryptor with given password
 */
export function createPiiEncryptor(password: string): PiiEncryptor {
  return new PiiEncryptor(password);
}
