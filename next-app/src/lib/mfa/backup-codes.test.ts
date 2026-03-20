/**
 * Tests for Backup Codes service
 */

import { describe, it, expect } from 'vitest';
import {
  generateBackupCode,
  generateBackupCodes,
  fingerprintBackupCode,
  generateSalt,
  verifyBackupCode,
  formatBackupCode,
  prepareBackupCodesForStorage,
  type BackupCode,
} from './backup-codes';

describe('Backup Codes Service', () => {
  describe('generateBackupCode', () => {
    it('generates a 12-character code', () => {
      const code = generateBackupCode();
      expect(code).toHaveLength(12);
    });

    it('generates lowercase alphanumeric codes', () => {
      const code = generateBackupCode();
      expect(code).toMatch(/^[a-z0-9]+$/);
    });

    it('generates different codes each time', () => {
      const code1 = generateBackupCode();
      const code2 = generateBackupCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('generateBackupCodes', () => {
    it('generates 10 codes by default', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('generates specified number of codes', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('generates unique codes', () => {
      const codes = generateBackupCodes();
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('fingerprintBackupCode', () => {
    it('generates consistent fingerprint for same code and salt', () => {
      const code = 'testcode1234';
      const salt = 'testsalt';

      const fp1 = fingerprintBackupCode(code, salt);
      const fp2 = fingerprintBackupCode(code, salt);

      expect(fp1).toBe(fp2);
    });

    it('generates different fingerprint for different salt', () => {
      const code = 'testcode1234';

      const fp1 = fingerprintBackupCode(code, 'salt1');
      const fp2 = fingerprintBackupCode(code, 'salt2');

      expect(fp1).not.toBe(fp2);
    });

    it('normalizes case and removes spaces', () => {
      const salt = 'testsalt';

      const fp1 = fingerprintBackupCode('TESTCODE1234', salt);
      const fp2 = fingerprintBackupCode('test code 1234', salt);
      const fp3 = fingerprintBackupCode('testcode1234', salt);

      expect(fp1).toBe(fp3);
      expect(fp2).toBe(fp3);
    });
  });

  describe('verifyBackupCode', () => {
    it('returns matching unused code', () => {
      const code = 'testcode1234';
      const salt = generateSalt();
      const fingerprint = fingerprintBackupCode(code, salt);

      const storedCodes: BackupCode[] = [
        {
          id: 1,
          userId: 123,
          codeFingerprint: fingerprint,
          codeCost: '',
          codeSalt: salt,
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      const result = verifyBackupCode(code, storedCodes);
      expect(result?.id).toBe(1);
    });

    it('returns null for invalid code', () => {
      const salt = generateSalt();
      const fingerprint = fingerprintBackupCode('realcode1234', salt);

      const storedCodes: BackupCode[] = [
        {
          id: 1,
          userId: 123,
          codeFingerprint: fingerprint,
          codeCost: '',
          codeSalt: salt,
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      const result = verifyBackupCode('wrongcode123', storedCodes);
      expect(result).toBeNull();
    });

    it('returns null for already used code', () => {
      const code = 'testcode1234';
      const salt = generateSalt();
      const fingerprint = fingerprintBackupCode(code, salt);

      const storedCodes: BackupCode[] = [
        {
          id: 1,
          userId: 123,
          codeFingerprint: fingerprint,
          codeCost: '',
          codeSalt: salt,
          usedAt: new Date(), // Already used
          createdAt: new Date(),
        },
      ];

      const result = verifyBackupCode(code, storedCodes);
      expect(result).toBeNull();
    });

    it('handles case-insensitive and spaced input', () => {
      const salt = generateSalt();
      const fingerprint = fingerprintBackupCode('abcd1234efgh', salt);

      const storedCodes: BackupCode[] = [
        {
          id: 1,
          userId: 123,
          codeFingerprint: fingerprint,
          codeCost: '',
          codeSalt: salt,
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      // Test with uppercase and spaces
      const result = verifyBackupCode('ABCD 1234 EFGH', storedCodes);
      expect(result?.id).toBe(1);
    });
  });

  describe('formatBackupCode', () => {
    it('adds spaces every 4 characters', () => {
      expect(formatBackupCode('abcd1234efgh')).toBe('abcd 1234 efgh');
    });

    it('handles codes not divisible by 4', () => {
      expect(formatBackupCode('abcde')).toBe('abcd e');
    });
  });

  describe('prepareBackupCodesForStorage', () => {
    it('creates storage records for all codes', () => {
      const codes = ['code1234abcd', 'efgh5678ijkl'];
      const records = prepareBackupCodesForStorage(codes, 123);

      expect(records).toHaveLength(2);
      expect(records[0].userId).toBe(123);
      expect(records[0].codeFingerprint).toBeTruthy();
      expect(records[0].codeSalt).toBeTruthy();
      expect(records[0].usedAt).toBeNull();
    });

    it('uses different salt for each code', () => {
      const codes = ['code1234abcd', 'efgh5678ijkl'];
      const records = prepareBackupCodesForStorage(codes, 123);

      expect(records[0].codeSalt).not.toBe(records[1].codeSalt);
    });
  });
});
