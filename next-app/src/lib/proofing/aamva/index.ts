/**
 * AAMVA Module - State ID verification via AAMVA DLDV 2.1 service
 * Mirrors: app/services/proofing/aamva/
 */

export { AamvaProofer, createAamvaProofer, type AamvaProoferOptions, type MaintenanceWindowChecker, type VerificationResponse } from './proofer';
export { StateIdResult, type StateIdResultOptions } from './state-id-result';
export { createAamvaApplicant, createAamvaApplicantWithExtras, type AamvaApplicant, type StateIdData, type ExtendedApplicantPii } from './applicant';
export { createAamvaConfig, type AamvaConfig, AAMVA_CONSTANTS, DOCUMENT_CATEGORY_CODES, SEX_CODES, VERIFICATION_ATTRIBUTES_MAP, VERIFICATION_REQUESTED_ATTRS } from './config';
