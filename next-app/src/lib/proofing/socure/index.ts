/**
 * Socure Proofing Module - Identity verification via Socure ID+
 * Mirrors: app/services/proofing/socure/*.rb
 */

// Types
export * from './types';

// KYC Proofer
export {
  SocureKycProofer,
  createSocureKycProofer,
  type KycProoferOptions,
} from './kyc-proofer';
