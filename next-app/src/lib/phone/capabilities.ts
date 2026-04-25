/**
 * Phone Number Capabilities Module
 * Migrated from Rails app/services/phone_number_capabilities.rb
 * 
 * Determines which OTP delivery methods (SMS, voice) are supported
 * for a given phone number based on country.
 */

import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

export type OtpDeliveryMethod = 'sms' | 'voice';

export interface CountryCapabilities {
  countryCode: string;
  name: string;
  supportsSms: boolean;
  supportsSmsUnconfirmed?: boolean;
  supportsVoice: boolean;
  supportsVoiceUnconfirmed?: boolean;
}

export type InternationalCodes = Record<string, CountryCapabilities>;

const DEFAULT_INTERNATIONAL_CODES: InternationalCodes = {
  US: {
    countryCode: '1',
    name: 'United States',
    supportsSms: true,
    supportsVoice: true,
  },
  CA: {
    countryCode: '1',
    name: 'Canada',
    supportsSms: true,
    supportsVoice: true,
  },
  AD: {
    countryCode: '376',
    name: 'Andorra',
    supportsSms: true,
    supportsVoice: false,
  },
  AE: {
    countryCode: '971',
    name: 'United Arab Emirates (UAE)',
    supportsSms: false,
    supportsVoice: true,
    supportsVoiceUnconfirmed: false,
  },
  AF: {
    countryCode: '93',
    name: 'Afghanistan',
    supportsSms: true,
    supportsSmsUnconfirmed: false,
    supportsVoice: false,
  },
  AG: {
    countryCode: '1268',
    name: 'Antigua and Barbuda',
    supportsSms: true,
    supportsVoice: false,
  },
  GB: {
    countryCode: '44',
    name: 'United Kingdom',
    supportsSms: true,
    supportsVoice: true,
  },
  AU: {
    countryCode: '61',
    name: 'Australia',
    supportsSms: true,
    supportsVoice: false,
  },
  DE: {
    countryCode: '49',
    name: 'Germany',
    supportsSms: true,
    supportsVoice: false,
  },
  FR: {
    countryCode: '33',
    name: 'France',
    supportsSms: true,
    supportsVoice: false,
  },
  MX: {
    countryCode: '52',
    name: 'Mexico',
    supportsSms: true,
    supportsVoice: false,
  },
  IN: {
    countryCode: '91',
    name: 'India',
    supportsSms: true,
    supportsSmsUnconfirmed: false,
    supportsVoice: false,
  },
  JP: {
    countryCode: '81',
    name: 'Japan',
    supportsSms: true,
    supportsVoice: false,
  },
  PH: {
    countryCode: '63',
    name: 'Philippines',
    supportsSms: true,
    supportsVoice: false,
  },
  AS: {
    countryCode: '1684',
    name: 'American Samoa',
    supportsSms: true,
    supportsSmsUnconfirmed: false,
    supportsVoice: true,
    supportsVoiceUnconfirmed: false,
  },
  GU: {
    countryCode: '1671',
    name: 'Guam',
    supportsSms: true,
    supportsVoice: true,
  },
  PR: {
    countryCode: '1787',
    name: 'Puerto Rico',
    supportsSms: true,
    supportsVoice: true,
  },
  VI: {
    countryCode: '1340',
    name: 'US Virgin Islands',
    supportsSms: true,
    supportsVoice: true,
  },
};

export interface PhoneNumberCapabilitiesOptions {
  phone: string;
  phoneConfirmed: boolean;
}

export interface PhoneNumberCapabilitiesConfig {
  internationalCodes?: InternationalCodes;
  addressIdentityProofingSupportedCountryCodes?: string[];
}

export class PhoneNumberCapabilities {
  readonly phone: string;
  readonly phoneConfirmed: boolean;
  private config: PhoneNumberCapabilitiesConfig;

  constructor(
    options: PhoneNumberCapabilitiesOptions,
    config: PhoneNumberCapabilitiesConfig = {}
  ) {
    this.phone = options.phone;
    this.phoneConfirmed = options.phoneConfirmed;
    this.config = config;
  }

  supports(method: OtpDeliveryMethod): boolean {
    switch (method) {
      case 'sms':
        return this.supportsSms();
      case 'voice':
        return this.supportsVoice();
      default:
        throw new Error(`Unknown method=${method}`);
    }
  }

  supportsAll(methods: OtpDeliveryMethod[]): boolean {
    return methods.every((method) => this.supports(method));
  }

  smsOnly(): boolean {
    return this.supportsSms() && !this.supportsVoice();
  }

  supportsSms(): boolean {
    const data = this.countryCodeData;
    if (!data) {
      return false;
    }

    const supportsSms = data.supportsSms;
    const supportsSmsUnconfirmed = data.supportsSmsUnconfirmed ?? supportsSms;

    return supportsSmsUnconfirmed || (supportsSms && this.phoneConfirmed);
  }

  supportsVoice(): boolean {
    const data = this.countryCodeData;
    if (!data) {
      return false;
    }

    const supportsVoice = data.supportsVoice;
    const supportsVoiceUnconfirmed = data.supportsVoiceUnconfirmed ?? supportsVoice;

    return supportsVoiceUnconfirmed || (supportsVoice && this.phoneConfirmed);
  }

  get unsupportedLocation(): string | undefined {
    return this.countryCodeData?.name;
  }

  private get countryCodeData(): CountryCapabilities | undefined {
    const codes = this.config.internationalCodes ?? DEFAULT_INTERNATIONAL_CODES;
    const countryCode = this.twoLetterCountryCode;
    return countryCode ? codes[countryCode] : undefined;
  }

  private get twoLetterCountryCode(): string | undefined {
    try {
      const parsed = parsePhoneNumber(this.phone);
      return parsed?.country;
    } catch {
      return undefined;
    }
  }
}

export function getTranslatedInternationalCodes(
  locale: string,
  internationalCodes: InternationalCodes = DEFAULT_INTERNATIONAL_CODES,
  translations: Record<string, Record<string, string>> = {}
): InternationalCodes {
  const result: InternationalCodes = {};

  for (const [code, data] of Object.entries(internationalCodes)) {
    const translatedName = translations[locale]?.[code.toLowerCase()] ?? data.name;
    result[code] = { ...data, name: translatedName };
  }

  return result;
}

export function createPhoneNumberCapabilities(
  options: PhoneNumberCapabilitiesOptions,
  config?: PhoneNumberCapabilitiesConfig
): PhoneNumberCapabilities {
  return new PhoneNumberCapabilities(options, config);
}

export { DEFAULT_INTERNATIONAL_CODES };
