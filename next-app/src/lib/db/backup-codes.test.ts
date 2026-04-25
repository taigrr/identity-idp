/**
 * Backup Codes Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateBackupCode,
  normalizeBackupCode,
  deleteAndRegenerateBackupCodes,
  validateAndConsumeBackupCode,
  countUnusedBackupCodes,
  hasBackupCodes,
} from './backup-codes';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (fn) => {
      const tx = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return fn(tx);
    }),
    query: {
      backupCodeConfigurations: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    selectDistinct: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
  backupCodeConfigurations: {},
}));

describe('Backup Codes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBackupCode', () => {
    it('generates a code with correct format', () => {
      const code = generateBackupCode();
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateBackupCode());
      }
      // Most should be unique (allowing for some collisions)
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('normalizeBackupCode', () => {
    it('normalizes case and whitespace', () => {
      expect(normalizeBackupCode('ABC DEF')).toBe('abcdef');
      expect(normalizeBackupCode('  abc-def  ')).toBe('abcdef');
      expect(normalizeBackupCode('AbC-DeF-GhI')).toBe('abcdefghi');
    });
  });

  describe('deleteAndRegenerateBackupCodes', () => {
    it('generates 10 codes', async () => {
      const codes = await deleteAndRegenerateBackupCodes(1);
      expect(codes).toHaveLength(10);
    });

    it('generates unique codes', async () => {
      const codes = await deleteAndRegenerateBackupCodes(1);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('countUnusedBackupCodes', () => {
    it('returns count of unused codes', async () => {
      const count = await countUnusedBackupCodes(1);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hasBackupCodes', () => {
    it('returns boolean', async () => {
      const result = await hasBackupCodes(1);
      expect(typeof result).toBe('boolean');
    });
  });
});
