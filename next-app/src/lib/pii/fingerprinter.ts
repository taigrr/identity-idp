/**
 * PII Fingerprinter - HMAC-based fingerprinting for PII data
 * Mirrors: app/services/pii/fingerprinter.rb
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Configuration for fingerprinter
 */
export interface FingerprinterConfig {
  /** Primary HMAC key for fingerprinting */
  currentKey: string;
  /** Queue of previous keys for verification rotation */
  keyQueue: string[];
}

/**
 * Get fingerprinter config from environment
 */
export function getFingerprinterConfig(): FingerprinterConfig {
  const keyQueue = process.env.HMAC_FINGERPRINTER_KEY_QUEUE;
  return {
    currentKey: process.env.HMAC_FINGERPRINTER_KEY || '',
    keyQueue: keyQueue ? keyQueue.split(',').filter(Boolean) : [],
  };
}

/**
 * Create HMAC-SHA256 fingerprint of text
 */
export function fingerprint(text: string, key?: string): string {
  const config = getFingerprinterConfig();
  const hmacKey = key ?? config.currentKey;

  if (!hmacKey) {
    throw new Error('HMAC fingerprinter key not configured');
  }

  const hmac = createHmac('sha256', hmacKey);
  hmac.update(text);
  return hmac.digest('hex');
}

/**
 * Get fingerprints using all previous keys
 */
export function previousFingerprints(text: string): string[] {
  const config = getFingerprinterConfig();
  return config.keyQueue.map((key) => fingerprint(text, key));
}

/**
 * Verify a fingerprint matches the text (current key or key queue)
 */
export function verify(text: string, fingerprintToVerify: string): boolean {
  return verifyWithCurrentKey(text, fingerprintToVerify) ||
         verifyWithKeyQueue(text, fingerprintToVerify);
}

/**
 * Verify fingerprint using current key (timing-safe comparison)
 */
export function verifyWithCurrentKey(text: string, fingerprintToVerify: string): boolean {
  const computed = fingerprint(text);
  return secureCompare(computed, fingerprintToVerify);
}

/**
 * Verify fingerprint against key queue (rotation support)
 */
export function verifyWithKeyQueue(text: string, fingerprintToVerify: string): boolean {
  const config = getFingerprinterConfig();

  for (const key of config.keyQueue) {
    const computed = fingerprint(text, key);
    if (secureCompare(computed, fingerprintToVerify)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a fingerprint is stale (needs rotation)
 */
export function isStale(text: string | undefined | null, storedFingerprint: string | undefined | null): boolean {
  // If text exists but no fingerprint, it's stale
  if (text && !storedFingerprint) {
    return true;
  }

  // If no text or fingerprint, not stale
  if (!text || !storedFingerprint) {
    return false;
  }

  // Check if current key produces the same fingerprint
  return !verifyWithCurrentKey(text, storedFingerprint);
}

/**
 * Timing-safe string comparison
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Fingerprinter class for OOP usage
 */
export class Fingerprinter {
  private config: FingerprinterConfig;

  constructor(config?: Partial<FingerprinterConfig>) {
    this.config = {
      ...getFingerprinterConfig(),
      ...config,
    };
  }

  /**
   * Create fingerprint of text
   */
  fingerprint(text: string, key?: string): string {
    const hmacKey = key ?? this.config.currentKey;

    if (!hmacKey) {
      throw new Error('HMAC fingerprinter key not configured');
    }

    const hmac = createHmac('sha256', hmacKey);
    hmac.update(text);
    return hmac.digest('hex');
  }

  /**
   * Get fingerprints using all previous keys
   */
  previousFingerprints(text: string): string[] {
    return this.config.keyQueue.map((key) => this.fingerprint(text, key));
  }

  /**
   * Verify a fingerprint
   */
  verify(text: string, fingerprintToVerify: string): boolean {
    return this.verifyWithCurrentKey(text, fingerprintToVerify) ||
           this.verifyWithKeyQueue(text, fingerprintToVerify);
  }

  /**
   * Verify with current key
   */
  verifyWithCurrentKey(text: string, fingerprintToVerify: string): boolean {
    const computed = this.fingerprint(text);
    return secureCompare(computed, fingerprintToVerify);
  }

  /**
   * Verify with key queue
   */
  verifyWithKeyQueue(text: string, fingerprintToVerify: string): boolean {
    for (const key of this.config.keyQueue) {
      const computed = this.fingerprint(text, key);
      if (secureCompare(computed, fingerprintToVerify)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if fingerprint is stale
   */
  isStale(text: string | undefined | null, storedFingerprint: string | undefined | null): boolean {
    if (text && !storedFingerprint) {
      return true;
    }
    if (!text || !storedFingerprint) {
      return false;
    }
    return !this.verifyWithCurrentKey(text, storedFingerprint);
  }
}

/**
 * Create a new Fingerprinter instance
 */
export function createFingerprinter(config?: Partial<FingerprinterConfig>): Fingerprinter {
  return new Fingerprinter(config);
}
