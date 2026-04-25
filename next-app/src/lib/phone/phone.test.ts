import { describe, it, expect } from 'vitest';
import {
  PhoneNumberCapabilities,
  DEFAULT_INTERNATIONAL_CODES,
} from './capabilities';

describe('PhoneNumberCapabilities', () => {
  describe('supportsSms', () => {
    it('returns true for US numbers', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsSms()).toBe(true);
    });

    it('returns true for unconfirmed US numbers', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: false },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsSms()).toBe(true);
    });

    it('returns false for unsupported countries', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+9712025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsSms()).toBe(false);
    });
  });

  describe('supportsVoice', () => {
    it('returns true for US numbers', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsVoice()).toBe(true);
    });

    it('returns false for SMS-only countries', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+61412345678', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsVoice()).toBe(false);
    });
  });

  describe('supports', () => {
    it('checks SMS support', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supports('sms')).toBe(true);
    });

    it('checks voice support', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supports('voice')).toBe(true);
    });

    it('throws for unknown method', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(() => caps.supports('email' as any)).toThrow('Unknown method');
    });
  });

  describe('supportsAll', () => {
    it('returns true when all methods supported', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsAll(['sms', 'voice'])).toBe(true);
    });

    it('returns false when not all methods supported', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+61412345678', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.supportsAll(['sms', 'voice'])).toBe(false);
    });
  });

  describe('smsOnly', () => {
    it('returns true for SMS-only countries', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+61412345678', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.smsOnly()).toBe(true);
    });

    it('returns false for countries with voice support', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.smsOnly()).toBe(false);
    });
  });

  describe('unsupportedLocation', () => {
    it('returns country name', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: '+12025551234', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.unsupportedLocation).toBe('United States');
    });

    it('returns undefined for invalid phone', () => {
      const caps = new PhoneNumberCapabilities(
        { phone: 'invalid', phoneConfirmed: true },
        { internationalCodes: DEFAULT_INTERNATIONAL_CODES }
      );
      expect(caps.unsupportedLocation).toBeUndefined();
    });
  });

  describe('unconfirmed phone handling', () => {
    it('blocks SMS for countries requiring confirmation', () => {
      const customCodes = {
        XX: {
          countryCode: '99',
          name: 'Test Country',
          supportsSms: true,
          supportsSmsUnconfirmed: false,
          supportsVoice: false,
        },
      };

      const caps = new PhoneNumberCapabilities(
        { phone: '+992025551234', phoneConfirmed: false },
        { internationalCodes: customCodes }
      );

      expect(caps.supportsSms()).toBe(false);
    });

    it('allows SMS after confirmation', () => {
      const customCodes = {
        AF: {
          countryCode: '93',
          name: 'Afghanistan',
          supportsSms: true,
          supportsSmsUnconfirmed: false,
          supportsVoice: false,
        },
      };

      const caps = new PhoneNumberCapabilities(
        { phone: '+93701234567', phoneConfirmed: true },
        { internationalCodes: customCodes }
      );

      expect(caps.supportsSms()).toBe(true);
    });
  });
});
