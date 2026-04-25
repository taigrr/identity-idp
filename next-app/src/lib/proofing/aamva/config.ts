/**
 * AAMVA Proofer Configuration
 * Mirrors: app/services/proofing/aamva/proofer.rb Config
 */

export interface AamvaConfig {
  authRequestTimeout: number;
  authUrl: string;
  certEnabled: boolean;
  privateKey: string;
  publicKey: string;
  verificationRequestTimeout: number;
  verificationUrl: string;
}

export function createAamvaConfig(overrides: Partial<AamvaConfig> = {}): AamvaConfig {
  return {
    authRequestTimeout: Number(process.env.AAMVA_AUTH_REQUEST_TIMEOUT) || 5,
    authUrl: process.env.AAMVA_AUTH_URL || '',
    certEnabled: process.env.AAMVA_CERT_ENABLED === 'true',
    privateKey: process.env.AAMVA_PRIVATE_KEY || '',
    publicKey: process.env.AAMVA_PUBLIC_KEY || '',
    verificationRequestTimeout: Number(process.env.AAMVA_VERIFICATION_REQUEST_TIMEOUT) || 5,
    verificationUrl: process.env.AAMVA_VERIFICATION_URL || 'https://verificationservices-cert.aamva.org:18449/dldv/2.1/online',
    ...overrides,
  };
}

/**
 * AAMVA-specific constants
 */
export const AAMVA_CONSTANTS = {
  SOAP_ACTION: '"http://aamva.org/dldv/wsdl/2.1/IDLDVService21/VerifyDriverLicenseData"',
  CONTENT_TYPE: 'application/soap+xml;charset=UTF-8',
  DEFAULT_VERIFICATION_URL: 'https://verificationservices-cert.aamva.org:18449/dldv/2.1/online',
  CERT_JURISDICTION: 'P6',
} as const;

/**
 * Document category codes for AAMVA
 * Note: passport is not actually supported by AAMVA but included for type safety
 */
export const DOCUMENT_CATEGORY_CODES: Record<string, number | undefined> = {
  drivers_license: 1,
  drivers_permit: 2,
  state_id_card: 3,
  passport: undefined,
};

/**
 * Sex codes for AAMVA
 */
export const SEX_CODES = {
  male: 1,
  female: 2,
} as const;

/**
 * States that need last name splitting
 */
export const SPLIT_LAST_NAME_STATES: string[] = [];

/**
 * Verification attribute mapping from AAMVA response to internal attributes
 */
export const VERIFICATION_ATTRIBUTES_MAP: Record<string, string> = {
  'DriverLicenseExpirationDateMatchIndicator': 'state_id_expiration',
  'DriverLicenseIssueDateMatchIndicator': 'state_id_issued',
  'DriverLicenseNumberMatchIndicator': 'state_id_number',
  'DocumentCategoryMatchIndicator': 'document_type_received',
  'PersonBirthDateMatchIndicator': 'dob',
  'PersonHeightMatchIndicator': 'height',
  'PersonSexCodeMatchIndicator': 'sex',
  'PersonWeightMatchIndicator': 'weight',
  'PersonEyeColorMatchIndicator': 'eye_color',
  'PersonLastNameExactMatchIndicator': 'last_name',
  'PersonFirstNameExactMatchIndicator': 'first_name',
  'PersonMiddleNameExactMatchIndicator': 'middle_name',
  'PersonNameSuffixMatchIndicator': 'name_suffix',
  'AddressLine1MatchIndicator': 'address1',
  'AddressLine2MatchIndicator': 'address2',
  'AddressCityMatchIndicator': 'city',
  'AddressStateCodeMatchIndicator': 'state',
  'AddressZIP5MatchIndicator': 'zipcode',
};

/**
 * Request attribute metadata for AAMVA
 */
export interface RequestAttribute {
  xpath: string;
  required: boolean;
}

export const VERIFICATION_REQUESTED_ATTRS: Record<string, RequestAttribute> = {
  first_name: { xpath: '//nc:PersonGivenName', required: true },
  middle_name: { xpath: '//nc:PersonMiddleName', required: false },
  last_name: { xpath: '//nc:PersonSurName', required: true },
  name_suffix: { xpath: '//nc:PersonNameSuffixText', required: false },
  dob: { xpath: '//aa:PersonBirthDate', required: true },
  address1: { xpath: '//nc:AddressDeliveryPointText', required: true },
  address2: { xpath: '//nc:AddressDeliveryPointText[2]', required: false },
  city: { xpath: '//nc:LocationCityName', required: true },
  state: { xpath: '//nc:LocationStateUsPostalServiceCode', required: true },
  zipcode: { xpath: '//nc:LocationPostalCode', required: true },
  state_id_number: { xpath: '//nc:IdentificationID', required: true },
  document_type_received: { xpath: '//aa:DocumentCategoryCode', required: false },
  state_id_expiration: { xpath: '//aa:DriverLicenseExpirationDate', required: false },
  state_id_jurisdiction: { xpath: '//aa:MessageDestinationId', required: true },
  state_id_issued: { xpath: '//aa:DriverLicenseIssueDate', required: false },
  eye_color: { xpath: '//aa:PersonEyeColorCode', required: false },
  height: { xpath: '//aa:PersonHeightMeasure', required: false },
  sex: { xpath: '//aa:PersonSexCode', required: false },
  weight: { xpath: '//aa:PersonWeightMeasure', required: false },
};
