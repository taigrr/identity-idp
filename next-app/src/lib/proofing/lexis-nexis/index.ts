/**
 * LexisNexis Module - Identity resolution via LexisNexis InstantVerify
 * Mirrors: app/services/proofing/lexis_nexis/
 */

export { InstantVerifyProofer, createInstantVerifyProofer, type InstantVerifyProoferOptions } from './instant-verify-proofer';
export { RequestSigner, createHmacAuthorization, type SignerConfig } from './request-signer';
export {
  createLexisNexisConfig,
  type LexisNexisConfig,
  type InstantVerifyApplicant,
  type InstantVerifyResponseBody,
  type InstantVerifyProduct,
  type InstantVerifyItem,
  CHECK_NAME_TO_ATTRIBUTE_MAP,
  mapFailedChecksToAttributes,
} from './config';
