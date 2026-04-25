/**
 * ThreatMetrix Module - Device profiling and fraud detection via LexisNexis DDP
 * Mirrors: app/services/proofing/lexis_nexis/ddp/proofers/threat_metrix_proofer.rb
 */

export { ThreatMetrixProofer, createThreatMetrixProofer, type ThreatMetrixProoferOptions } from './proofer';
export { DdpResult, type DdpResultOptions } from './ddp-result';
export {
  createThreatMetrixConfig,
  type ThreatMetrixConfig,
  type ThreatMetrixApplicant,
  THREATMETRIX_CONSTANTS,
  VALID_REVIEW_STATUSES,
  type ThreatMetrixReviewStatus,
} from './config';
