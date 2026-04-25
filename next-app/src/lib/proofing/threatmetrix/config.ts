/**
 * ThreatMetrix Configuration
 * Mirrors: LexisNexis DDP config for ThreatMetrix
 */

export interface ThreatMetrixConfig {
  apiKey: string;
  orgId: string;
  baseUrl: string;
  ddpPolicy: string;
  timeout: number;
}

export function createThreatMetrixConfig(overrides: Partial<ThreatMetrixConfig> = {}): ThreatMetrixConfig {
  return {
    apiKey: process.env.LEXISNEXIS_THREATMETRIX_API_KEY || '',
    orgId: process.env.LEXISNEXIS_THREATMETRIX_ORG_ID || '',
    baseUrl: process.env.LEXISNEXIS_THREATMETRIX_BASE_URL || 'https://api.threatmetrix.com',
    ddpPolicy: process.env.LEXISNEXIS_THREATMETRIX_POLICY || '',
    timeout: Number(process.env.LEXISNEXIS_THREATMETRIX_TIMEOUT) || 30,
    ...overrides,
  };
}

/**
 * ThreatMetrix API constants
 */
export const THREATMETRIX_CONSTANTS = {
  SESSION_QUERY_PATH: '/api/session-query',
  EVENT_TYPE: 'ACCOUNT_CREATION',
  SERVICE_TYPE: 'all',
  NATIONAL_ID_TYPE: 'US_SSN',
  DRIVERS_LICENSE_TYPE: 'us_dl',
} as const;

/**
 * Valid review status values from ThreatMetrix
 */
export const VALID_REVIEW_STATUSES = ['pass', 'review', 'reject'] as const;
export type ThreatMetrixReviewStatus = typeof VALID_REVIEW_STATUSES[number];

/**
 * ThreatMetrix applicant data for request
 */
export interface ThreatMetrixApplicant {
  // Required identifiers
  uuid: string;
  uuidPrefix?: string;
  threatmetrixSessionId: string;
  requestIp: string;
  workflow: string;

  // PII
  firstName: string;
  lastName: string;
  email: string;
  dob: string; // YYYY-MM-DD format

  // SSN (optional)
  ssn?: string;

  // Address
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;

  // State ID (optional)
  stateIdNumber?: string;
  stateIdJurisdiction?: string;
}
