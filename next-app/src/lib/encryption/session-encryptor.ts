/**
 * Session Encryptor - encrypts/decrypts session data
 * Mirrors: lib/session_encryptor.rb
 *
 * Features:
 * - AES encryption of session data
 * - KMS encryption of sensitive paths (PII fields)
 * - Gzip compression for large sessions
 * - MessagePack serialization
 */

import { gzipSync, gunzipSync } from 'zlib';
import msgpack from 'msgpack-lite';
import * as aesCipher from './aes-cipher';
import { KmsClientWrapper } from './kms-client';
import { EncryptionError } from './errors';
import { getConfig } from '../config';

const CIPHERTEXT_HEADER = 'v3';
const MINIMUM_COMPRESS_LIMIT = 300;
const CIPHERTEXT_KEY = 't';
const COMPRESSED_KEY = 'c';
const VERSION_KEY = 'v';

// Keys that should never appear unencrypted in session
const SENSITIVE_KEYS = new Set([
  'first_name',
  'middle_name',
  'last_name',
  'address1',
  'address2',
  'city',
  'state',
  'zipcode',
  'zip_code',
  'identity_doc_address1',
  'identity_doc_address2',
  'identity_doc_city',
  'identity_doc_zipcode',
  'identity_doc_address_state',
  'state_id_jurisdiction',
  'same_address_as_id',
  'dob',
  'phone_number',
  'phone',
  'ssn',
  'prev_address1',
  'prev_address2',
  'prev_city',
  'prev_state',
  'prev_zipcode',
  'pii',
  'pii_from_doc',
  'pii_from_user',
  'password',
  'personal_key',
  'email',
  'email_address',
  'unconfirmed_phone',
]);

// Paths in session that contain sensitive data
const SENSITIVE_PATHS: string[][] = [
  ['warden.user.user.session', 'idv/attempts'],
  ['warden.user.user.session', 'idv/in_person'],
  ['warden.user.user.session', 'idv'],
  ['warden.user.user.session', 'personal_key'],
  ['warden.user.user.session', 'unconfirmed_phone'],
  ['flash', 'flashes', 'personal_key'],
  ['flash', 'flashes', 'email'],
  ['email'],
];

export class SensitiveKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SensitiveKeyError';
  }
}

export class SensitiveValueError extends Error {
  constructor() {
    super('Session contains sensitive default values');
    this.name = 'SensitiveValueError';
  }
}

type SessionData = Record<string, unknown>;

interface PackedPayload {
  [VERSION_KEY]: string;
  [CIPHERTEXT_KEY]: string;
  [COMPRESSED_KEY]: number;
}

export class SessionEncryptor {
  private kmsClient: KmsClientWrapper;

  constructor() {
    const config = getConfig();
    this.kmsClient = new KmsClientWrapper(config.awsKmsSessionKeyId);
  }

  /**
   * Loads and decrypts session data from MessagePack buffer
   */
  async load(value: Buffer): Promise<SessionData> {
    const payload = msgpack.decode(value) as PackedPayload;
    const ciphertext = payload[CIPHERTEXT_KEY];
    const compressed = payload[COMPRESSED_KEY];

    let decrypted = this.outerDecrypt(ciphertext);

    if (compressed === 1) {
      decrypted = gunzipSync(Buffer.from(decrypted, 'utf8')).toString('utf8');
    }

    const session = JSON.parse(decrypted) as SessionData;
    await this.kmsDecryptSensitivePaths(session);

    return session;
  }

  /**
   * Encrypts and dumps session data to MessagePack buffer
   */
  async dump(value: SessionData): Promise<Buffer> {
    await this.kmsEncryptSensitivePaths(value, SENSITIVE_PATHS);
    this.alertOrRaiseIfContainsSensitiveKeys(value);

    const plain = JSON.stringify(value);

    let payload: PackedPayload;

    if (this.shouldCompress(plain)) {
      payload = {
        [VERSION_KEY]: CIPHERTEXT_HEADER,
        [CIPHERTEXT_KEY]: this.outerEncrypt(gzipSync(plain).toString('utf8')),
        [COMPRESSED_KEY]: 1,
      };
    } else {
      payload = {
        [VERSION_KEY]: CIPHERTEXT_HEADER,
        [CIPHERTEXT_KEY]: this.outerEncrypt(plain),
        [COMPRESSED_KEY]: 0,
      };
    }

    return msgpack.encode(payload);
  }

  /**
   * KMS encrypts text with session context
   */
  async kmsEncrypt(text: string): Promise<string> {
    const encrypted = await this.kmsClient.encrypt(text, {
      context: 'session-encryption',
    });
    return Buffer.from(encrypted).toString('base64');
  }

  /**
   * KMS decrypts text with session context
   */
  async kmsDecrypt(text: string): Promise<string> {
    return this.kmsClient.decrypt(Buffer.from(text, 'base64').toString('utf8'), {
      context: 'session-encryption',
    });
  }

  private outerEncrypt(plaintext: string): string {
    const config = getConfig();
    return aesCipher.encrypt(
      plaintext,
      Buffer.from(config.sessionEncryptionKey, 'utf8')
    );
  }

  private outerDecrypt(ciphertext: string): string {
    const config = getConfig();
    return aesCipher.decrypt(
      ciphertext,
      Buffer.from(config.sessionEncryptionKey, 'utf8')
    );
  }

  /**
   * Extracts sensitive paths and encrypts them separately
   */
  private async kmsEncryptSensitivePaths(
    session: SessionData,
    sensitivePaths: string[][]
  ): Promise<void> {
    const sensitiveData: SessionData = {};

    for (const path of sensitivePaths) {
      const allButLastKey = path.slice(0, -1);
      const lastKey = path[path.length];

      let value: unknown;
      if (allButLastKey.length === 0) {
        value = session[lastKey];
        delete session[lastKey];
      } else {
        const parent = this.dig(session, allButLastKey) as SessionData | undefined;
        if (parent && lastKey in parent) {
          value = parent[lastKey];
          delete parent[lastKey];
        }
      }

      if (value !== undefined) {
        this.bury(sensitiveData, path, value);
      }
    }

    if (session['sensitive_data'] !== undefined) {
      throw new EncryptionError("invalid session, 'sensitive_data' is reserved key");
    }

    if (Object.keys(sensitiveData).length > 0) {
      session['sensitive_data'] = await this.kmsEncrypt(
        JSON.stringify(sensitiveData)
      );
    }
  }

  /**
   * Decrypts sensitive paths and merges back into session
   */
  private async kmsDecryptSensitivePaths(session: SessionData): Promise<void> {
    const sensitiveDataEncrypted = session['sensitive_data'] as string | undefined;
    delete session['sensitive_data'];

    if (!sensitiveDataEncrypted) {
      return;
    }

    const sensitiveDataJson = await this.kmsDecrypt(sensitiveDataEncrypted);
    const sensitiveData = JSON.parse(sensitiveDataJson) as SessionData;

    this.deepMerge(session, sensitiveData);
  }

  private alertOrRaiseIfContainsSensitiveKeys(hash: SessionData): void {
    const config = getConfig();
    this.deepTransformKeys(hash, (key: string) => {
      if (SENSITIVE_KEYS.has(key)) {
        const error = new SensitiveKeyError(
          `${key} unexpectedly appeared in session`
        );
        if (config.sessionEncryptorAlertEnabled) {
          console.error('Session sensitive key error:', error);
        } else {
          throw error;
        }
      }
    });
  }

  private shouldCompress(value: string): boolean {
    return Buffer.byteLength(value) >= MINIMUM_COMPRESS_LIMIT;
  }

  // Helper: dig into nested object
  private dig(obj: SessionData, path: string[]): unknown {
    let current: unknown = obj;
    for (const key of path) {
      if (current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as SessionData)[key];
    }
    return current;
  }

  // Helper: set value at nested path, creating objects as needed
  private bury(obj: SessionData, path: string[], value: unknown): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as SessionData;
    }
    current[path[path.length - 1]] = value;
  }

  // Helper: deep merge source into target
  private deepMerge(target: SessionData, source: SessionData): void {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        this.deepMerge(targetValue as SessionData, sourceValue as SessionData);
      } else {
        target[key] = sourceValue;
      }
    }
  }

  // Helper: iterate all keys in nested object
  private deepTransformKeys(
    obj: SessionData,
    transform: (key: string) => void
  ): void {
    for (const key of Object.keys(obj)) {
      transform(key);
      const value = obj[key];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.deepTransformKeys(value as SessionData, transform);
      }
    }
  }
}

/**
 * Create session encryptor instance
 */
export function createSessionEncryptor(): SessionEncryptor {
  return new SessionEncryptor();
}
