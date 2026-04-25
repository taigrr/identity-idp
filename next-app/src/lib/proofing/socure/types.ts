/**
 * Socure ID+ Proofing Types
 * Mirrors: app/services/proofing/socure/id_plus/*.rb
 */

/**
 * Socure ID+ input for KYC verification
 * Mirrors: Proofing::Socure::IdPlus::Input
 */
export interface SocureInput {
  address1?: string;
  address2?: string;
  city?: string;
  dob?: string; // YYYY-MM-DD
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
  email?: string;
  ssn?: string;
  consent_given_at?: string; // ISO 8601
}

/**
 * Socure ID+ configuration
 */
export interface SocureConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  userUuid: string;
  userEmail?: string;
  autoFailureReasonCodes: string[];
}

/**
 * Socure KYC request body
 */
export interface SocureKycRequestBody {
  modules: string[];
  customerUserId: string;
  firstName?: string;
  surName?: string;
  country: string;
  physicalAddress?: string;
  physicalAddress2?: string;
  city?: string;
  state?: string;
  zip?: string;
  nationalId?: string;
  dob?: string;
  userConsent: boolean;
  consentTimestamp?: string;
  email?: string;
  mobileNumber?: string;
  countryOfOrigin: string;
}

/**
 * Socure KYC response body
 */
export interface SocureKycResponseBody {
  referenceId: string;
  kyc?: {
    reasonCodes?: string[];
    fieldValidations?: Record<string, number>;
    socureId?: string;
    sourceAttribution?: string[];
  };
}

/**
 * Field validation mapping for verified attributes
 */
export const VERIFIED_ATTRIBUTE_MAP: Record<string, string | string[]> = {
  address: ['streetAddress', 'city', 'state', 'zip'],
  first_name: 'firstName',
  last_name: 'surName',
  phone: 'mobileNumber',
  ssn: 'ssn',
  dob: 'dob',
};

/**
 * Required attributes for KYC success
 */
export const REQUIRED_ATTRIBUTES = new Set([
  'first_name',
  'last_name',
  'address',
  'dob',
  'ssn',
]);

/**
 * Get Socure config from environment
 */
export function getSocureConfig(
  userUuid: string,
  userEmail?: string
): SocureConfig {
  return {
    apiKey: process.env.SOCURE_ID_PLUS_API_KEY || '',
    baseUrl: process.env.SOCURE_ID_PLUS_BASE_URL || 'https://api.socure.com/api/3.0',
    timeout: Number(process.env.SOCURE_ID_PLUS_TIMEOUT) || 30,
    userUuid,
    userEmail,
    autoFailureReasonCodes: (process.env.IDV_SOCURE_KYC_AUTO_FAILURE_REASON_CODES || '')
      .split(',')
      .filter(Boolean),
  };
}
