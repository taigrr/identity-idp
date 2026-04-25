/**
 * Resolution Module - Identity resolution proofing
 * Mirrors: app/services/proofing/resolution/
 */

export { ResolutionResult, type ResolutionResultOptions } from './result';
export { ResultAdjudicator, createResultAdjudicator, type ResultAdjudicatorParams, type AdjudicatedResult, type PhoneResult } from './result-adjudicator';
export { ProgressiveProofer, createProgressiveProofer, type ProgressiveProoferOptions, type ProofParams } from './progressive-proofer';
export * from './plugins';
