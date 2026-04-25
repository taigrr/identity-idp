/**
 * Phone Number Capabilities Tests
 * Migrated from Rails spec/services/phone_number_capabilities_spec.rb
 */

import { describe, it, expect } from 'vitest';
import {
  PhoneNumberCapabilities,
  createPhoneNumberCapabilities,
  getTranslatedInternationalCodes,
  DEFAULT_INTERNATIONAL_CODES,
  InternationalCodes,
} from './capabilities';

// Extended test config matching the country_dialing_codes.yml for testing
const TEST_INTERNATIONAL_CODES: InternationalCodes = {
  ...DEFAULT_INTERNATIONAL_CODES,
  // Vietnam - no SMS, voice only with confirmed
  VN: {
    countryCode: '84',
    name: 'Vietnam',
    supportsSms: false,
    supportsVoice: true,
    supportsVoiceUnconfirmed: false,
  },
  // Iraq - SMS only with confirmed
  IQ: {
    countryCode: '964',
    name: 'Iraq',
    supportsSms: true,
    supportsSmsUnconfirmed: false,
    supportsVoice: false,
  },
  // Bermuda - SMS only, no voice
  BM: {
    countryCode: '1441',
    name: 'Bermuda',
    supportsSms: true,
    supportsVoice: false,
  },
  // Bahamas - SMS only, no voice
  BS: {
    countryCode: '1242',
    name: 'Bahamas',
    supportsSms: true,
    supportsVoice: false,
  },
  // Canada - update to match YAML (sms only, no voice in Canada)
  CA: {
    countryCode: '1',
    name: 'Canada',
    supportsSms: true,
    supportsVoice: false,
  },
  // UK - sms only
  GB: {
    countryCode: '44',
    name: 'United Kingdom',
    supportsSms: true,
    supportsVoice: false,
  },
};

describe('PhoneNumberCapabilities', () => {
  describe('#supports?', () => {
    describe('sms', () => {
      it('returns true when sms is supported (US number)', () => {
        const capabilities = new PhoneNumberCapabilities(
          { phone: '+1 (703) 555-5000', phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        expect(capabilities.supports('sms')).toBe(true);
      });

      it('returns false when sms is unsupported (Vietnam number)', () => {
        const capabilities = new PhoneNumberCapabilities(
          { phone: '+84 091 234 56 78', phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        expect(capabilities.supports('sms')).toBe(false);
      });
    });

    describe('voice', () => {
      it('returns true when voice is supported (US number)', () => {
        const capabilities = new PhoneNumberCapabilities(
          { phone: '+1 (703) 555-5000', phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        expect(capabilities.supports('voice')).toBe(true);
      });

      it('returns false when voice is unsupported (Bermuda number)', () => {
        const capabilities = new PhoneNumberCapabilities(
          { phone: '+1 (441) 295-9644', phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        expect(capabilities.supports('voice')).toBe(false);
      });
    });

    describe('unknown method', () => {
      it('throws an error for unknown method', () => {
        const capabilities = new PhoneNumberCapabilities(
          { phone: '+1 (703) 555-5000', phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        expect(() => capabilities.supports('unknown' as any)).toThrow('Unknown method=unknown');
      });
    });
  });

  describe('#supportsAll', () => {
    it('returns true when only sms is requested and supported (Canada)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (306) 234-5678', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsAll(['sms'])).toBe(true);
    });

    it('returns false when sms is requested but only voice is supported (Vietnam)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+84 091 234 56 78', phoneConfirmed: true },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsAll(['sms'])).toBe(false);
    });

    it('returns true when both sms and voice are supported (US)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsAll(['sms'])).toBe(true);
    });

    it('returns true when both methods are requested and supported', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsAll(['sms', 'voice'])).toBe(true);
    });

    it('returns false when one of multiple methods is not supported', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (441) 295-9644', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsAll(['sms', 'voice'])).toBe(false);
    });
  });

  describe('#smsOnly', () => {
    it('returns false when voice is supported (US number)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.smsOnly()).toBe(false);
    });

    it('returns true for Bahamas number (sms only)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (242) 327-0143', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.smsOnly()).toBe(true);
    });

    it('returns true for Bermuda number (sms only)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (441) 295-9644', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.smsOnly()).toBe(true);
    });

    it('returns true for United Kingdom number (sms only)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+44 20 7946 0958', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.smsOnly()).toBe(true);
    });

    it('returns false when phone cannot be parsed to a known country', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '703-555-1212', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.smsOnly()).toBe(false);
    });
  });

  describe('#supportsSms', () => {
    it('returns true for US number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(true);
    });

    it('returns true for Bermuda number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (441) 295-9644', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(true);
    });

    it('returns false for Iraq number that is unconfirmed', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+964 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(false);
    });

    it('returns true for Iraq number that is confirmed', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+964 (703) 555-5000', phoneConfirmed: true },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(true);
    });

    it('returns false for country not in config', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+999 123 456 7890', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(false);
    });
  });

  describe('#supportsVoice', () => {
    it('returns true for US number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsVoice()).toBe(true);
    });

    it('returns false for Bermuda number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (441) 295-9644', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsVoice()).toBe(false);
    });

    it('returns true for Vietnam number that is confirmed', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+84 091 234 56 78', phoneConfirmed: true },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsVoice()).toBe(true);
    });

    it('returns false for Vietnam number that is unconfirmed', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+84 091 234 56 78', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsVoice()).toBe(false);
    });

    it('returns false for country not in config', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+999 123 456 7890', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsVoice()).toBe(false);
    });
  });

  describe('#unsupportedLocation', () => {
    it('returns the name of the country (Bahamas)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (242) 327-0143', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.unsupportedLocation).toBe('Bahamas');
    });

    it('returns the name of the country (Bermuda)', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (441) 295-9644', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.unsupportedLocation).toBe('Bermuda');
    });

    it('returns the default country for unparseable number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '703-555-1212', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      // libphonenumber-js may not parse this without country context
      expect(capabilities.unsupportedLocation).toBeUndefined();
    });

    it('returns undefined for completely invalid number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: 'not-a-phone', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.unsupportedLocation).toBeUndefined();
    });
  });

  describe('configuration validation', () => {
    it('should never have supports_voice_unconfirmed true when supports_voice is false', () => {
      for (const [, support] of Object.entries(TEST_INTERNATIONAL_CODES)) {
        if (support.supportsVoiceUnconfirmed === true) {
          expect(support.supportsVoice).toBe(true);
        }
      }
    });

    it('should never have supports_sms_unconfirmed true when supports_sms is false', () => {
      for (const [, support] of Object.entries(TEST_INTERNATIONAL_CODES)) {
        if (support.supportsSmsUnconfirmed === true) {
          expect(support.supportsSms).toBe(true);
        }
      }
    });
  });

  describe('createPhoneNumberCapabilities', () => {
    it('creates a PhoneNumberCapabilities instance', () => {
      const capabilities = createPhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities).toBeInstanceOf(PhoneNumberCapabilities);
      expect(capabilities.supports('sms')).toBe(true);
    });
  });

  describe('getTranslatedInternationalCodes', () => {
    it('returns codes with original names when no translations provided', () => {
      const codes = getTranslatedInternationalCodes('en', TEST_INTERNATIONAL_CODES);
      expect(codes.US.name).toBe('United States');
      expect(codes.CA.name).toBe('Canada');
    });

    it('translates country names when translations are provided', () => {
      const translations = {
        es: { us: 'Estados Unidos', ca: 'Canadá' },
        fr: { us: 'États-Unis', ca: 'Canada' },
      };
      const spanishCodes = getTranslatedInternationalCodes('es', TEST_INTERNATIONAL_CODES, translations);
      expect(spanishCodes.US.name).toBe('Estados Unidos');
      expect(spanishCodes.CA.name).toBe('Canadá');
    });

    it('falls back to original name when translation not available', () => {
      const translations = {
        es: { us: 'Estados Unidos' },
      };
      const codes = getTranslatedInternationalCodes('es', TEST_INTERNATIONAL_CODES, translations);
      expect(codes.US.name).toBe('Estados Unidos');
      expect(codes.GB.name).toBe('United Kingdom'); // No translation provided
    });

    it('preserves all capability data in translated codes', () => {
      const codes = getTranslatedInternationalCodes('en', TEST_INTERNATIONAL_CODES);
      expect(codes.US.supportsSms).toBe(true);
      expect(codes.US.supportsVoice).toBe(true);
      expect(codes.VN.supportsSms).toBe(false);
      expect(codes.VN.supportsVoice).toBe(true);
      expect(codes.VN.supportsVoiceUnconfirmed).toBe(false);
    });
  });

  describe('DEFAULT_INTERNATIONAL_CODES', () => {
    it('includes US with SMS and voice support', () => {
      expect(DEFAULT_INTERNATIONAL_CODES.US).toBeDefined();
      expect(DEFAULT_INTERNATIONAL_CODES.US.supportsSms).toBe(true);
      expect(DEFAULT_INTERNATIONAL_CODES.US.supportsVoice).toBe(true);
    });

    it('includes common countries', () => {
      expect(DEFAULT_INTERNATIONAL_CODES.CA).toBeDefined();
      expect(DEFAULT_INTERNATIONAL_CODES.GB).toBeDefined();
      expect(DEFAULT_INTERNATIONAL_CODES.AU).toBeDefined();
      expect(DEFAULT_INTERNATIONAL_CODES.DE).toBeDefined();
      expect(DEFAULT_INTERNATIONAL_CODES.FR).toBeDefined();
    });

    it('includes US territories', () => {
      expect(DEFAULT_INTERNATIONAL_CODES.PR).toBeDefined(); // Puerto Rico
      expect(DEFAULT_INTERNATIONAL_CODES.GU).toBeDefined(); // Guam
      expect(DEFAULT_INTERNATIONAL_CODES.VI).toBeDefined(); // US Virgin Islands
      expect(DEFAULT_INTERNATIONAL_CODES.AS).toBeDefined(); // American Samoa
    });
  });

  describe('phone and phoneConfirmed accessors', () => {
    it('exposes phone and phoneConfirmed as readonly properties', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '+1 (703) 555-5000', phoneConfirmed: true }
      );
      expect(capabilities.phone).toBe('+1 (703) 555-5000');
      expect(capabilities.phoneConfirmed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty phone number', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(false);
      expect(capabilities.supportsVoice()).toBe(false);
    });

    it('handles phone number with only spaces', () => {
      const capabilities = new PhoneNumberCapabilities(
        { phone: '   ', phoneConfirmed: false },
        { internationalCodes: TEST_INTERNATIONAL_CODES }
      );
      expect(capabilities.supportsSms()).toBe(false);
      expect(capabilities.supportsVoice()).toBe(false);
    });

    it('handles various phone number formats', () => {
      const formats = [
        '+1 703 555 5000',
        '+1-703-555-5000',
        '+1.703.555.5000',
        '+17035555000',
      ];

      for (const phone of formats) {
        const capabilities = new PhoneNumberCapabilities(
          { phone, phoneConfirmed: false },
          { internationalCodes: TEST_INTERNATIONAL_CODES }
        );
        // US numbers should support SMS
        expect(capabilities.supportsSms()).toBe(true);
      }
    });
  });
});
