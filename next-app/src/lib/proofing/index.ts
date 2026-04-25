/**
 * Proofing Module - Identity proofing services for Login.gov
 * Mirrors: app/services/proofing/
 *
 * This module provides identity verification services including:
 * - AAMVA: State ID verification via DMV records
 * - LexisNexis InstantVerify: Identity resolution
 * - ThreatMetrix: Device profiling and fraud detection
 * - Mock: Testing and development
 */

// Types
export * from './types';

// Resolution results
export { ResolutionResult, type ResolutionResultOptions } from './resolution';

// AAMVA (State ID verification)
export {
  AamvaProofer,
  createAamvaProofer,
  StateIdResult,
  createAamvaApplicant,
  createAamvaConfig,
  type AamvaConfig,
  type AamvaApplicant,
  type AamvaProoferOptions,
  type StateIdResultOptions,
} from './aamva';

// ThreatMetrix (Device profiling)
export {
  ThreatMetrixProofer,
  createThreatMetrixProofer,
  DdpResult,
  createThreatMetrixConfig,
  type ThreatMetrixConfig,
  type ThreatMetrixApplicant,
  type ThreatMetrixProoferOptions,
  type DdpResultOptions,
} from './threatmetrix';

// LexisNexis InstantVerify (Identity resolution)
export {
  InstantVerifyProofer,
  createInstantVerifyProofer,
  createLexisNexisConfig,
  createHmacAuthorization,
  type LexisNexisConfig,
  type InstantVerifyApplicant,
  type InstantVerifyProoferOptions,
} from './lexis-nexis';

// Mock proofers (Testing/Development)
export {
  MockResolutionProofer,
  MockAamvaProofer,
  MockThreatMetrixProofer,
  createMockResolutionProofer,
  createMockAamvaProofer,
  createMockThreatMetrixProofer,
  type MockProofingConfig,
  MOCK_SSN_TRIGGERS,
} from './mock';
