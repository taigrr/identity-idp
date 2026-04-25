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

// Authorize Form
export {
  validateAuthorizeForm,
  buildSuccessRedirectUri,
  addParamsToUri,
  type AuthorizeParams,
  type ServiceProviderConfig,
  type AuthorizeFormErrors,
  type AuthorizeFormResult,
  type ParsedAuthorizeParams,
} from './authorize-form';

// Access Token Verifier
export {
  verifyAccessToken,
  AccessTokenVerifier,
  type ServiceProviderIdentity,
  type AccessTokenVerifierDeps,
  type AccessTokenVerifierResult,
} from './access-token-verifier';

// AuthnContext Resolver
export {
  AuthnContextResolver,
  createAuthnContextResolver,
  parseAcrValues,
  type AcrResult,
} from './authn-context-resolver';

// Identity Linker
export {
  IdentityLinker,
  createIdentityLinker,
  IAL1,
  IAL2,
  type LinkIdentityOptions,
  type IdentityLinkerDeps,
} from './identity-linker';

// UserInfo Presenter
export {
  UserInfoPresenter,
  buildUserInfo,
  type UserInfoIdentity,
  type UserInfoUser,
  type UserInfoServiceProvider,
  type UserInfoPii,
  type UserInfoX509,
  type UserInfoDeps,
  type UserInfoResponse,
} from './userinfo-presenter';

// Database Queries
export {
  findIdentityByCode,
  findIdentityByAccessToken,
  findServiceProvider,
  clearAuthorizationCode,
  createOidcQueries,
  type TokenIdentity,
  type UserInfoIdentity as QueryUserInfoIdentity,
  type ServiceProviderData,
  type OidcQueries,
} from './queries';
