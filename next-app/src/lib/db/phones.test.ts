/**
 * Phone Configuration Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fingerprintPhone,
  createOrUpdatePhoneConfiguration,
  confirmPhoneConfiguration,
  getUserPhoneConfigurations,
  getUserConfirmedPhones,
  getDefaultPhone,
  deletePhoneConfiguration,
  setDefaultPhone,
  updateDeliveryPreference,
  isPhoneOptedOut,
  optOutPhone,
  optInPhone,
  countConfirmedPhones,
  DeliveryPreference,
} from './phones';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      phoneConfigurations: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      phoneNumberOptOuts: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          encryptedPhone: 'encrypted',
          deliveryPreference: 0,
          mfaEnabled: true,
          confirmedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
  },
  phoneConfigurations: {},
  phoneNumberOptOuts: {},
}));

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn().mockResolvedValue('encrypted-value'),
  decrypt: vi.fn().mockResolvedValue('+1234567890'),
}));

describe('Phone Configuration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fingerprintPhone', () => {
    it('creates consistent fingerprints', () => {
      const fp1 = fingerprintPhone('+1234567890');
      const fp2 = fingerprintPhone('+1234567890');
      expect(fp1).toBe(fp2);
    });

    it('normalizes phone before fingerprinting', () => {
      const fp1 = fingerprintPhone('+1 (234) 567-890');
      const fp2 = fingerprintPhone('1234567890');
      expect(fp1).toBe(fp2);
    });
  });

  describe('DeliveryPreference', () => {
    it('has correct values', () => {
      expect(DeliveryPreference.SMS).toBe(0);
      expect(DeliveryPreference.VOICE).toBe(1);
    });
  });

  describe('createOrUpdatePhoneConfiguration', () => {
    it('creates a phone configuration', async () => {
      const result = await createOrUpdatePhoneConfiguration(1, '+1234567890');
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  describe('isPhoneOptedOut', () => {
    it('returns boolean', async () => {
      const result = await isPhoneOptedOut('+1234567890');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('countConfirmedPhones', () => {
    it('returns count', async () => {
      const count = await countConfirmedPhones(1);
      expect(typeof count).toBe('number');
    });
  });
});
