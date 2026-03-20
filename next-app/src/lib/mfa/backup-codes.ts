/**
 * Backup Codes Service
 * Mirrors: app/models/backup_code_configuration.rb
 *
 * Generates and verifies backup codes for account recovery.
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const BACKUP_CODE_LENGTH = 12;
const BACKUP_CODE_COUNT = 10;

export interface BackupCode {
  id: number;
  userId: number;
  codeFingerprint: string;
  codeCost: string;
  codeSalt: string;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Generates a single backup code as a 12-character alphanumeric string
 */
export function generateBackupCode(): string {
  // Use hex for simple, consistent length output
  const bytes = randomBytes(6); // 6 bytes = 12 hex characters
  return bytes.toString('hex').toLowerCase();
}

/**
 * Generates a set of backup codes
 */
export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Creates a fingerprint of a backup code for storage
 * Uses SHA256 with salt for security
 */
export function fingerprintBackupCode(code: string, salt: string): string {
  const normalized = code.toLowerCase().replace(/\s/g, '');
  return createHash('sha256')
    .update(normalized + salt)
    .digest('hex');
}

/**
 * Generates a salt for backup code fingerprinting
 */
export function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verifies a backup code against stored fingerprints
 * Returns the matching BackupCode if valid, null otherwise
 */
export function verifyBackupCode(
  code: string,
  storedCodes: BackupCode[]
): BackupCode | null {
  const normalized = code.toLowerCase().replace(/\s/g, '');

  for (const stored of storedCodes) {
    // Skip already used codes
    if (stored.usedAt !== null) {
      continue;
    }

    const inputFingerprint = fingerprintBackupCode(normalized, stored.codeSalt);

    // Timing-safe comparison
    if (
      inputFingerprint.length === stored.codeFingerprint.length &&
      timingSafeEqual(
        Buffer.from(inputFingerprint),
        Buffer.from(stored.codeFingerprint)
      )
    ) {
      return stored;
    }
  }

  return null;
}

/**
 * Formats backup codes for display (adds spaces for readability)
 * e.g., "abcd1234efgh" -> "abcd 1234 efgh"
 */
export function formatBackupCode(code: string): string {
  return code.match(/.{1,4}/g)?.join(' ') ?? code;
}

/**
 * Formats all backup codes for display
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map(formatBackupCode);
}

/**
 * Prepares backup codes for database storage
 */
export function prepareBackupCodesForStorage(
  codes: string[],
  userId: number
): Omit<BackupCode, 'id'>[] {
  return codes.map((code) => {
    const salt = generateSalt();
    return {
      userId,
      codeFingerprint: fingerprintBackupCode(code, salt),
      codeCost: '', // Not using scrypt for backup codes
      codeSalt: salt,
      usedAt: null,
      createdAt: new Date(),
    };
  });
}
