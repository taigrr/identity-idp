/**
 * PII Module - Personally Identifiable Information handling
 * Mirrors: app/services/pii/*.rb
 */

// Types
export * from './types';

// Attributes
export {
  createPiiAttributesFromHash,
  createPiiAttributesFromJson,
  piiAttributesToJson,
  piiAttributesEqual,
  createPiiAddress,
  mergePiiAttributes,
  redactPii,
  extractAddress,
  extractIdentityDocAddress,
  isSameAddressAsId,
  normalizeSsn,
  formatSsn,
  validatePiiAttributes,
} from './attributes';

// Fingerprinter
export {
  fingerprint,
  previousFingerprints,
  verify,
  verifyWithCurrentKey,
  verifyWithKeyQueue,
  isStale,
  Fingerprinter,
  createFingerprinter,
  type FingerprinterConfig,
} from './fingerprinter';

// State ID
export {
  createStateId,
  getStateIdDocType,
  stateIdRequiresResidentialAddress,
  stateIdToPiiAddress,
  StateId,
} from './state-id';

// Passport
export {
  createPassport,
  getPassportDocType,
  passportRequiresResidentialAddress,
  passportToPiiAddress,
  Passport,
} from './passport';

// Cacher
export {
  PiiCacher,
  createPiiCacher,
  type UserSession,
  type Profile,
  type User,
  type Analytics,
} from './cacher';

// USPS Applicant
export {
  createUspsApplicant,
  createUspsApplicantFromIdvApplicant,
  createUspsApplicantFromPiiAttributes,
  hasAddressLine2,
  UspsApplicant,
} from './usps-applicant';
