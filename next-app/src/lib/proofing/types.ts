/**
 * Proofing types - Common types for identity proofing services
 * Mirrors: app/services/proofing/*.rb
 */

/**
 * PII (Personally Identifiable Information) for proofing applicant
 * Used across all proofing services
 */
export interface ApplicantPii {
  // Name
  first_name: string;
  last_name: string;
  middle_name?: string;
  name_suffix?: string;

  // Date of birth
  dob: string; // YYYY-MM-DD format

  // Social Security Number (optional for some proofing)
  ssn?: string;

  // Residential address
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;

  // State ID information
  state_id_number?: string;
  state_id_type?: StateIdType;
  state_id_jurisdiction?: string;
  state_id_expiration?: string;

  // Identity document address (may differ from residential)
  identity_doc_address1?: string;
  identity_doc_address2?: string;
  identity_doc_city?: string;
  identity_doc_address_state?: string;
  identity_doc_zipcode?: string;

  // Additional fields
  same_address_as_id?: string; // "true" or "false" string
  phone?: string;
  email?: string;
  uuid?: string;

  // Pre-verified attributes from AAMVA at doc auth
  aamva_verified_attributes?: string[];

  // Best effort phone for Socure
  best_effort_phone_number_for_socure?: string;
}

export type StateIdType =
  | 'drivers_license'
  | 'drivers_permit'
  | 'state_id_card'
  | 'passport';

/**
 * Proofing vendor types
 */
export type ProofingVendor =
  | 'mock'
  | 'instant_verify'
  | 'instant_verify_ddp'
  | 'socure_kyc';

/**
 * Workflow type for proofing
 */
export type ProofingWorkflow = 'idv' | 'auth' | 'idv_hybrid_handoff' | 'auth_hybrid_handoff';

/**
 * Base proofing result interface
 */
export interface BaseProofingResult {
  success: boolean;
  errors: Record<string, string[]>;
  exception?: Error | null;
  timedOut: boolean;
  transactionId: string;
}

/**
 * Resolution result - for identity resolution proofing
 * Mirrors: Proofing::Resolution::Result
 */
export interface ResolutionResult extends BaseProofingResult {
  vendorName: string;
  vendorId?: string; // e.g., SocureID
  customerUserId?: string;
  reference: string;
  reasonCodes: Record<string, string[]>;
  sourceAttribution: string[];
  failedResultCanPassWithAdditionalVerification: boolean;
  attributesRequiringAdditionalVerification: string[];
  vendorWorkflow?: string;
  verifiedAttributes?: string[];
}

/**
 * State ID result - for AAMVA state ID verification
 * Mirrors: Proofing::StateIdResult
 */
export interface StateIdResult extends BaseProofingResult {
  vendorName: string;
  requestedAttributes: Record<string, number>;
  verifiedAttributes: string[];
  mvaException: boolean;
  jurisdictionInMaintenanceWindow: boolean;
}

/**
 * DDP (Device Data Platform) result - for ThreatMetrix device profiling
 * Mirrors: Proofing::DdpResult
 */
export interface DdpResult extends BaseProofingResult {
  client: string;
  reviewStatus: DdpReviewStatus | null;
  accountLexId?: string;
  sessionId?: string;
  responseBody?: DdpResponseBody;
  deviceFingerprint?: string;
  context?: Record<string, unknown>;
}

export type DdpReviewStatus = 'pass' | 'review' | 'reject';

export interface DdpResponseBody {
  request_id?: string;
  request_result?: string;
  review_status?: string;
  account_lex_id?: string;
  session_id?: string;
  fuzzy_device_id?: string;
  [key: string]: unknown;
}

/**
 * Address proofing result
 * Mirrors: Proofing::AddressResult
 */
export interface AddressResult extends BaseProofingResult {
  vendorName: string;
}

/**
 * Phone proofing result
 */
export interface PhoneResult {
  success: boolean;
  errors: Record<string, string[]>;
  exception?: Error | null;
  transactionId?: string;
  vendorName?: string;
}

/**
 * MVA (Motor Vehicle Agency) exception constants
 */
export const MVA_EXCEPTION_CODES = {
  MVA_UNAVAILABLE: 'ExceptionId: 0001',
  MVA_SYSTEM_ERROR: 'ExceptionId: 0002',
  MVA_TIMEOUT: 'ExceptionId: 0047',
  UNEXPECTED_ERROR_CODE: 'Unexpected status code',
} as const;

/**
 * Custom error class for proofing timeouts
 * Mirrors: Proofing::TimeoutError
 */
export class ProofingTimeoutError extends Error {
  constructor(message: string = 'Proofing request timed out') {
    super(message);
    this.name = 'ProofingTimeoutError';
  }
}

/**
 * Required verification attributes for AAMVA
 */
export const AAMVA_REQUIRED_VERIFICATION_ATTRIBUTES = [
  'state_id_number',
  'dob',
  'last_name',
  'first_name',
] as const;

/**
 * Required if present attributes for AAMVA
 */
export const AAMVA_REQUIRED_IF_PRESENT_ATTRIBUTES = ['state_id_expiration'] as const;

/**
 * Address attributes for normalization
 */
export const ADDRESS_ATTRIBUTES = new Set([
  'address1',
  'address2',
  'city',
  'state',
  'zipcode',
]);

export const OPTIONAL_ADDRESS_ATTRIBUTES = new Set(['address2']);

export const REQUIRED_ADDRESS_ATTRIBUTES = new Set(
  [...ADDRESS_ATTRIBUTES].filter((attr) => !OPTIONAL_ADDRESS_ATTRIBUTES.has(attr))
);

/**
 * Proofing vendor SP cost tokens
 */
export const PROOFING_VENDOR_SP_COST_TOKENS: Record<ProofingVendor, string> = {
  mock: 'mock_resolution',
  instant_verify: 'lexis_nexis_resolution',
  instant_verify_ddp: 'lexis_nexis_resolution',
  socure_kyc: 'socure_resolution',
};

/**
 * Helper to check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is ProofingTimeoutError {
  return error instanceof ProofingTimeoutError;
}

/**
 * Helper to check MVA exceptions from error message
 */
export function checkMvaException(
  exception?: Error | null
): {
  mvaUnavailable: boolean;
  mvaSystemError: boolean;
  mvaTimeout: boolean;
  unexpectedErrorCode: boolean;
  isMvaException: boolean;
} {
  const message = exception?.message ?? '';

  const mvaUnavailable = message.includes(MVA_EXCEPTION_CODES.MVA_UNAVAILABLE);
  const mvaSystemError = message.includes(MVA_EXCEPTION_CODES.MVA_SYSTEM_ERROR);
  const mvaTimeout = message.includes(MVA_EXCEPTION_CODES.MVA_TIMEOUT);
  const unexpectedErrorCode = message.includes(MVA_EXCEPTION_CODES.UNEXPECTED_ERROR_CODE);

  return {
    mvaUnavailable,
    mvaSystemError,
    mvaTimeout,
    unexpectedErrorCode,
    isMvaException: mvaUnavailable || mvaSystemError || mvaTimeout,
  };
}
