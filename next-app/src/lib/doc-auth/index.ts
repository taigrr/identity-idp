/**
 * DocAuth module - Document authentication for identity proofing
 * @see app/services/doc_auth/
 *
 * This module provides document verification (driver's license, passport, state ID)
 * using vendor APIs like LexisNexis TrueID and Socure.
 *
 * Usage:
 *
 * import { createDocAuthClient, DocAuthErrors } from '@/lib/doc-auth';
 *
 * const client = createDocAuthClient();
 *
 * const result = await client.postImages({
 *   frontImage: frontImageBuffer,
 *   backImage: backImageBuffer,
 *   userUuid: 'user-uuid',
 *   livenessCheckingRequired: true,
 * });
 *
 * if (result.success) {
 *   console.log('Verified:', result.piiFromDoc);
 * } else {
 *   console.log('Failed:', result.errors);
 * }
 */

export * from './types';
export * from './errors';
export { DocAuthResponse } from './response';
export { LexisNexisClient, type LexisNexisConfig } from './lexis-nexis';
export { MockDocAuthClient, type MockClientConfig, type MockErrorScenario } from './mock';
export {
  SocureClient,
  SocureApiError,
  SocureDocvResultResponse,
  createSocureClient,
  type SocureConfig,
  type SocureDocumentRequestParams,
  type SocureDocumentRequestResponse,
  type SocureDocvResultRequestParams,
  type SocureImagesRequestParams,
  type SocureImages,
  type SocureIdPlusResponse,
  type SocureWebhookPayload,
} from './socure';

import type { DocAuthClient } from './types';
import { LexisNexisClient } from './lexis-nexis';
import { MockDocAuthClient } from './mock';

export type DocAuthVendor = 'lexisnexis' | 'socure' | 'mock';

/**
 * Create a document auth client based on configuration
 * Note: Socure uses a different API pattern (session-based) and should
 * be used directly via SocureClient rather than through this factory.
 */
export function createDocAuthClient(
  vendor?: DocAuthVendor
): DocAuthClient {
  const selectedVendor = vendor || (process.env.DOC_AUTH_VENDOR as DocAuthVendor) || 'mock';

  switch (selectedVendor) {
    case 'lexisnexis':
      return new LexisNexisClient();
    case 'socure':
      throw new Error('Socure uses session-based API - use SocureClient directly');
    case 'mock':
    default:
      return new MockDocAuthClient();
  }
}

/**
 * Get the configured document auth vendor
 */
export function getDocAuthVendor(): DocAuthVendor {
  return (process.env.DOC_AUTH_VENDOR as DocAuthVendor) || 'mock';
}
