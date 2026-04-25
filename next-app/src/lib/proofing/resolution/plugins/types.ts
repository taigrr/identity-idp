/**
 * Proofing Resolution Plugins - Plugin interfaces and types
 * Mirrors: app/services/proofing/resolution/plugins/
 */

import type { ApplicantPii } from '../../types';
import type { ResolutionResult } from '../result';
import type { StateIdResult } from '../../aamva/state-id-result';
import type { DdpResult } from '../../threatmetrix/ddp-result';

/**
 * Timer interface for tracking proofing step durations
 */
export interface ProofingTimer {
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
}

/**
 * Simple timer implementation
 */
export class SimpleTimer implements ProofingTimer {
  private timings: Record<string, number> = {};

  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.timings[label] = Date.now() - start;
    }
  }

  getTimings(): Record<string, number> {
    return { ...this.timings };
  }
}

/**
 * Current service provider context
 */
export interface CurrentSP {
  issuer: string;
  friendlyName?: string;
}

/**
 * Address mapping for state ID address transformation
 */
export const SECONDARY_ID_ADDRESS_MAP: Record<string, keyof ApplicantPii> = {
  identity_doc_address1: 'address1',
  identity_doc_address2: 'address2',
  identity_doc_city: 'city',
  identity_doc_address_state: 'state',
  identity_doc_zipcode: 'zipcode',
};

/**
 * Transform PII to use state ID address fields
 */
export function withStateIdAddress(pii: ApplicantPii): ApplicantPii {
  // Destructure to remove address fields, then spread identity doc address fields
  const {
    address1: _a1,
    address2: _a2,
    city: _c,
    state: _s,
    zipcode: _z,
    ...rest
  } = pii;

  return {
    ...rest,
    // Map identity doc address to main address
    address1: pii.identity_doc_address1 || '',
    address2: pii.identity_doc_address2,
    city: pii.identity_doc_city || '',
    state: pii.identity_doc_address_state || '',
    zipcode: pii.identity_doc_zipcode || '',
  };
}

/**
 * Check if residential address is same as state ID address
 */
export function sameAddressAsId(pii: ApplicantPii): boolean {
  return pii.same_address_as_id === 'true';
}

/**
 * Attributes that AAMVA can verify to cover failed resolution
 */
export const AAMVA_COVERABLE_ATTRIBUTES = ['address', 'dob', 'state_id_number'] as const;

/**
 * Check if passport document type
 */
export function isPassportApplicant(pii: ApplicantPii): boolean {
  return pii.state_id_type === 'passport';
}

/**
 * Proofing configuration from environment
 */
export interface ProofingConfig {
  // AAMVA
  aamvaSupportedJurisdictions: string[];
  prooferMockFallback: boolean;

  // ThreatMetrix
  proofingDeviceProfilingEnabled: boolean;
  threatmetrixMockEnabled: boolean;
  threatmetrixPolicy: string;

  // Phone precheck
  phonePreCheckPercent: number;
}

export function getProofingConfig(): ProofingConfig {
  return {
    aamvaSupportedJurisdictions: (process.env.AAMVA_SUPPORTED_JURISDICTIONS || '').split(',').filter(Boolean),
    prooferMockFallback: process.env.PROOFER_MOCK_FALLBACK === 'true',
    proofingDeviceProfilingEnabled: process.env.PROOFING_DEVICE_PROFILING_ENABLED === 'true',
    threatmetrixMockEnabled: process.env.LEXISNEXIS_THREATMETRIX_MOCK_ENABLED === 'true',
    threatmetrixPolicy: process.env.LEXISNEXIS_THREATMETRIX_POLICY || '',
    phonePreCheckPercent: Number(process.env.IDV_PHONE_PRECHECK_PERCENT) || 0,
  };
}

/**
 * Vendor name constants
 */
export const VENDOR_NAMES = {
  AAMVA_UNSUPPORTED_JURISDICTION: 'aamva:unsupported_jurisdiction',
  AAMVA_CHECK_SKIPPED: 'aamva:check_skipped',
  RESIDENTIAL_ADDRESS_NOT_REQUIRED: 'ResidentialAddressNotRequired',
  RESOLUTION_CANNOT_PASS: 'ResolutionCannotPass',
  NO_PHONE_AVAILABLE: 'NoPhoneNumberAvailable',
  TMX_DISABLED: 'tmx_disabled',
  TMX_PII_MISSING: 'tmx_pii_missing',
  TMX_SESSION_ID_MISSING: 'tmx_session_id_missing',
} as const;
