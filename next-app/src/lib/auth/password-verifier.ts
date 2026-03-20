/**
 * Password Verifier - verifies user passwords using scrypt + KMS
 * Mirrors: app/services/encryption/password_verifier.rb
 *
 * Password storage format:
 * {
 *   encrypted_password: KMS-encrypted scrypt digest,
 *   password_salt: hex string,
 *   password_cost: scrypt cost string "N$r$p$"
 * }
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { scrypt } from 'scrypt-js';
import { KmsClientWrapper } from '../encryption/kms-client';
import { EncryptionError } from '../encryption/errors';
import { getConfig } from '../config';

export interface PasswordDigest {
  encrypted_password: string;
  encryption_key?: string;
  password_salt: string;
  password_cost: string;
}

export interface RegionalDigestPair {
  multi_region?: string;
  single_region?: string;
}

export class PasswordVerifier {
  private singleRegionKmsClient: KmsClientWrapper;
  private multiRegionKmsClient: KmsClientWrapper;

  constructor() {
    const config = getConfig();
    this.singleRegionKmsClient = new KmsClientWrapper(config.awsKmsKeyId);
    this.multiRegionKmsClient = new KmsClientWrapper(config.awsKmsMultiRegionKeyId);
  }

  /**
   * Creates a new password digest for storage
   */
  async createDigest(password: string, userUuid: string): Promise<string> {
    const config = getConfig();
    const salt = randomBytes(32).toString('hex');
    const cost = config.scryptCost;

    const scryptedPassword = await this.scryptPasswordDigest(password, salt, cost);

    const encryptedPassword = await this.multiRegionKmsClient.encrypt(
      scryptedPassword,
      this.kmsEncryptionContext(userUuid)
    );

    const digest: PasswordDigest = {
      encrypted_password: encryptedPassword,
      password_salt: salt,
      password_cost: cost,
    };

    return JSON.stringify(digest);
  }

  /**
   * Verifies a password against a stored digest
   */
  async verify(
    password: string,
    digestPair: RegionalDigestPair,
    userUuid: string
  ): Promise<boolean> {
    try {
      const digestString = digestPair.multi_region ?? digestPair.single_region;
      if (!digestString) {
        return false;
      }

      const passwordDigest = this.parseDigest(digestString);

      // Check if it's a legacy UAK digest (has encryption_key)
      if (passwordDigest.encryption_key) {
        // Legacy UAK verification would go here
        // For now, return false as we're migrating away from this
        console.warn('Legacy UAK password digest encountered');
        return false;
      }

      return this.verifyPasswordAgainstDigest(password, passwordDigest, userUuid);
    } catch (err) {
      if (err instanceof EncryptionError) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Checks if a digest uses the old UAK format
   */
  isStaleDigest(digest: string | null | undefined): boolean {
    if (!digest) {
      return false;
    }
    try {
      const parsed = this.parseDigest(digest);
      return !!parsed.encryption_key;
    } catch {
      return false;
    }
  }

  private parseDigest(digestString: string): PasswordDigest {
    try {
      const data = JSON.parse(digestString) as PasswordDigest;
      if (!data.encrypted_password || !data.password_salt || !data.password_cost) {
        throw new EncryptionError('digest missing required fields');
      }
      return data;
    } catch (err) {
      if (err instanceof EncryptionError) {
        throw err;
      }
      throw new EncryptionError('digest contains invalid json');
    }
  }

  private async verifyPasswordAgainstDigest(
    password: string,
    passwordDigest: PasswordDigest,
    userUuid: string
  ): Promise<boolean> {
    const scryptedPassword = await this.scryptPasswordDigest(
      password,
      passwordDigest.password_salt,
      passwordDigest.password_cost
    );

    const decryptedKmsDigest = await this.multiRegionKmsClient.decrypt(
      passwordDigest.encrypted_password,
      this.kmsEncryptionContext(userUuid)
    );

    // Timing-safe comparison
    return this.secureCompare(scryptedPassword, decryptedKmsDigest);
  }

  /**
   * Derives scrypt password digest
   * Mirrors Rails: SCrypt::Engine.hash_secret
   */
  private async scryptPasswordDigest(
    password: string,
    salt: string,
    cost: string
  ): Promise<string> {
    // Build scrypt salt: cost + SHA256(salt)
    const scryptSalt = cost + createHash('sha256').update(salt).digest('hex');

    // Parse cost string "N$r$p$"
    const [nStr, rStr, pStr] = cost.split('$');
    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);

    const passwordBuffer = Buffer.from(password, 'utf8');
    const saltBuffer = Buffer.from(scryptSalt, 'utf8');

    // scrypt with 32-byte output
    const derived = await scrypt(passwordBuffer, saltBuffer, N, r, p, 32);

    return Buffer.from(derived).toString('base64');
  }

  private kmsEncryptionContext(userUuid: string): Record<string, string> {
    return {
      context: 'password-digest',
      user_uuid: userUuid,
    };
  }

  /**
   * Timing-safe string comparison (like Devise.secure_compare)
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

/**
 * Create password verifier instance
 */
export function createPasswordVerifier(): PasswordVerifier {
  return new PasswordVerifier();
}
