/**
 * Tests for SMS/Voice OTP service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateOtpCode,
  createOtp,
  verifyOtp,
  maskPhoneNumber,
  sendSmsOtp,
  sendVoiceOtp,
} from './otp-sms';

describe('OTP SMS Service', () => {
  describe('generateOtpCode', () => {
    it('generates a 6-digit code', () => {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('generates different codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateOtpCode());
      }
      // Should have many unique codes (statistically very unlikely to have <90)
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('createOtp', () => {
    it('returns code and expiration', () => {
      const otp = createOtp();

      expect(otp.code).toMatch(/^\d{6}$/);
      expect(otp.expiresAt).toBeInstanceOf(Date);
      expect(otp.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('sets expiration 10 minutes in future', () => {
      const before = Date.now();
      const otp = createOtp();
      const after = Date.now();

      const tenMinutes = 10 * 60 * 1000;
      expect(otp.expiresAt.getTime()).toBeGreaterThanOrEqual(before + tenMinutes);
      expect(otp.expiresAt.getTime()).toBeLessThanOrEqual(after + tenMinutes + 1000);
    });
  });

  describe('verifyOtp', () => {
    it('returns true for valid unexpired code', () => {
      const code = '123456';
      const expiresAt = new Date(Date.now() + 60000); // 1 minute from now

      expect(verifyOtp(code, code, expiresAt)).toBe(true);
    });

    it('returns false for wrong code', () => {
      const expiresAt = new Date(Date.now() + 60000);

      expect(verifyOtp('123456', '654321', expiresAt)).toBe(false);
    });

    it('returns false for expired code', () => {
      const code = '123456';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      expect(verifyOtp(code, code, expiresAt)).toBe(false);
    });

    it('handles codes with spaces', () => {
      const code = '123456';
      const expiresAt = new Date(Date.now() + 60000);

      expect(verifyOtp('123 456', code, expiresAt)).toBe(true);
      expect(verifyOtp('1 2 3 4 5 6', code, expiresAt)).toBe(true);
    });
  });

  describe('maskPhoneNumber', () => {
    it('shows only last 4 digits', () => {
      expect(maskPhoneNumber('+12025551234')).toBe('(***) ***-1234');
      expect(maskPhoneNumber('2025551234')).toBe('(***) ***-1234');
    });

    it('handles short numbers', () => {
      expect(maskPhoneNumber('123')).toBe('***');
    });

    it('strips non-digits before masking', () => {
      expect(maskPhoneNumber('(202) 555-1234')).toBe('(***) ***-1234');
    });
  });

  describe('sendSmsOtp', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('succeeds in non-production environment', async () => {
      const result = await sendSmsOtp('+12025551234', '123456');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[SMS]')
      );
    });
  });

  describe('sendVoiceOtp', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('succeeds in non-production environment', async () => {
      const result = await sendVoiceOtp('+12025551234', '123456');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[VOICE]')
      );
    });
  });
});
