/**
 * OIDC Module
 * OpenID Connect implementation for Login.gov
 */

// Constants
export * from './constants';

// Scopes
export * from './scopes';

// Key management
export {
  getOidcConfig,
  generateKeyPair,
  importKeyPair,
  initializeKeys,
  getPrimaryKeyPair,
  getAllKeyPairs,
  generateJwks,
  resetKeys,
  type OidcKeyPair,
} from './keys';

// ID Token
export {
  buildIdToken,
  verifyIdToken,
  generateAccessToken,
  generateAuthorizationCode,
  type IdTokenClaims,
  type IdTokenBuilderOptions,
} from './id-token';

// PKCE
export {
  generateCodeChallenge,
  verifyCodeChallenge,
  generateCodeVerifier,
} from './pkce';

// Client Assertion
export {
  validateClientAssertion,
  getTokenEndpointUrl,
  type ClientAssertionValidationResult,
} from './client-assertion';
