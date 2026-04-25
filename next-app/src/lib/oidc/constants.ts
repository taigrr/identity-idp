/**
 * OIDC Constants
 * Mirrors: lib/saml_idp/constants.rb and related OIDC config
 */

// ACR (Authentication Context Class Reference) values
export const ACR_VALUES = {
  // IAL (Identity Assurance Level)
  IAL1: 'http://idmanagement.gov/ns/assurance/ial/1',
  IAL2: 'http://idmanagement.gov/ns/assurance/ial/2',
  IAL_MAX: 'http://idmanagement.gov/ns/assurance/ial/0',
  IAL_VERIFIED: 'urn:acr.login.gov:verified',
  IAL_AUTH_ONLY: 'urn:acr.login.gov:auth-only',

  // Facial match IAL contexts
  IAL_VERIFIED_FACIAL_MATCH_REQUIRED:
    'urn:acr.login.gov:verified-facial-match-required',
  IAL_VERIFIED_FACIAL_MATCH_PREFERRED:
    'urn:acr.login.gov:verified-facial-match-preferred',
  IAL2_BIO_REQUIRED: 'http://idmanagement.gov/ns/assurance/ial/2?bio=required',
  IAL2_BIO_PREFERRED:
    'http://idmanagement.gov/ns/assurance/ial/2?bio=preferred',

  // Legacy LOA (Level of Assurance)
  LOA1: 'http://idmanagement.gov/ns/assurance/loa/1',
  LOA3: 'http://idmanagement.gov/ns/assurance/loa/3',

  // AAL (Authentication Assurance Level)
  AAL1: 'http://idmanagement.gov/ns/assurance/aal/1',
  AAL2: 'http://idmanagement.gov/ns/assurance/aal/2',
  AAL2_PHISHING_RESISTANT:
    'http://idmanagement.gov/ns/assurance/aal/2?phishing_resistant=true',
  AAL2_HSPD12: 'http://idmanagement.gov/ns/assurance/aal/2?hspd12=true',
  AAL3: 'http://idmanagement.gov/ns/assurance/aal/3',
  AAL3_HSPD12: 'http://idmanagement.gov/ns/assurance/aal/3?hspd12=true',
  DEFAULT_AAL: 'urn:gov:gsa:ac:classes:sp:PasswordProtectedTransport:duo',
} as const;

// All valid ACR values
export const VALID_AUTHN_CONTEXTS = Object.values(ACR_VALUES);

// Facial match IAL contexts (all facial match options)
export const FACIAL_MATCH_IAL_CONTEXTS = [
  ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED,
  ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED,
  ACR_VALUES.IAL2_BIO_REQUIRED,
  ACR_VALUES.IAL2_BIO_PREFERRED,
];

// Facial match REQUIRED contexts (not preferred)
export const FACIAL_MATCH_REQUIRED_IAL_CONTEXTS = [
  ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED,
  ACR_VALUES.IAL2_BIO_REQUIRED,
];

// ACR to IAL mapping (0 = IALMAX, 1 = IAL1, 2 = IAL2)
export const ACR_TO_IAL: Record<string, number> = {
  [ACR_VALUES.IAL1]: 1,
  [ACR_VALUES.LOA1]: 1,
  [ACR_VALUES.IAL_AUTH_ONLY]: 1,
  [ACR_VALUES.IAL2]: 2,
  [ACR_VALUES.LOA3]: 2,
  [ACR_VALUES.IAL_VERIFIED]: 2,
  [ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED]: 2,
  [ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED]: 2,
  [ACR_VALUES.IAL2_BIO_REQUIRED]: 2,
  [ACR_VALUES.IAL2_BIO_PREFERRED]: 2,
  [ACR_VALUES.IAL_MAX]: 0,
};

// AAL priority (higher index = higher priority)
export const AALS_BY_PRIORITY = [
  ACR_VALUES.AAL2_HSPD12,
  ACR_VALUES.AAL3_HSPD12,
  ACR_VALUES.AAL2_PHISHING_RESISTANT,
  ACR_VALUES.AAL3,
  ACR_VALUES.AAL2,
  ACR_VALUES.DEFAULT_AAL,
  ACR_VALUES.AAL1,
];

// IAL priority (higher index = higher IAL)
export const IALS_BY_PRIORITY = [
  ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_REQUIRED,
  ACR_VALUES.IAL2_BIO_REQUIRED,
  ACR_VALUES.IAL_VERIFIED_FACIAL_MATCH_PREFERRED,
  ACR_VALUES.IAL2_BIO_PREFERRED,
  ACR_VALUES.IAL_VERIFIED,
  ACR_VALUES.IAL2,
  ACR_VALUES.LOA3,
  ACR_VALUES.IAL_MAX,
  ACR_VALUES.IAL_AUTH_ONLY,
  ACR_VALUES.IAL1,
  ACR_VALUES.LOA1,
];

// OIDC grant types
export const GRANT_TYPES = ['authorization_code'] as const;
export type GrantType = (typeof GRANT_TYPES)[number];

// OIDC response types
export const RESPONSE_TYPES = ['code'] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

// Subject types
export const SUBJECT_TYPES = ['pairwise'] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

// Signing algorithms
export const ID_TOKEN_SIGNING_ALGS = ['RS256'] as const;
export type SigningAlgorithm = (typeof ID_TOKEN_SIGNING_ALGS)[number];

// Token endpoint auth methods
export const TOKEN_ENDPOINT_AUTH_METHODS = ['private_key_jwt'] as const;
export type TokenAuthMethod = (typeof TOKEN_ENDPOINT_AUTH_METHODS)[number];

// PKCE code challenge methods
export const CODE_CHALLENGE_METHODS = ['S256'] as const;
export type CodeChallengeMethod = (typeof CODE_CHALLENGE_METHODS)[number];

// Prompt values
export const PROMPT_VALUES = ['login', 'select_account'] as const;
export type PromptValue = (typeof PROMPT_VALUES)[number];

// Minimum length for state and nonce
export const RANDOM_VALUE_MINIMUM_LENGTH = 22;

// Minimum verified_within duration in days
export const MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS = 30;

// Client assertion type for private_key_jwt
export const CLIENT_ASSERTION_TYPE =
  'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

// Issued at leeway for JWT validation
export const ISSUED_AT_LEEWAY_SECONDS = 10;
