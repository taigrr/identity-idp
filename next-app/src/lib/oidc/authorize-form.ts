/**
 * OIDC Authorization Form Validator
 * Validates incoming OIDC authorization requests
 * Mirrors: app/forms/openid_connect_authorize_form.rb
 */

import {
  ACR_VALUES,
  VALID_AUTHN_CONTEXTS,
  ACR_TO_IAL,
  AALS_BY_PRIORITY,
  IALS_BY_PRIORITY,
  FACIAL_MATCH_IAL_CONTEXTS,
  RANDOM_VALUE_MINIMUM_LENGTH,
  MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS,
  CODE_CHALLENGE_METHODS,
  PROMPT_VALUES,
  type PromptValue,
} from './constants';
import { VALID_SCOPES, VALID_IAL1_SCOPES } from './scopes';

export interface AuthorizeParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  nonce?: string;
  acr_values?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  prompt?: string;
  verified_within?: string;
}

export interface ServiceProviderConfig {
  issuer: string;
  active: boolean;
  ial?: number | null;
  pkce?: boolean | null;
  allowPromptLogin?: boolean;
  redirectUris: string[];
  allowIalMax?: boolean;
  facialMatchAllowed?: boolean;
  verifiedWithinAllowed?: boolean;
}

export interface AuthorizeFormErrors {
  acr_values?: string;
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  nonce?: string;
  prompt?: string;
  code_challenge_method?: string;
  verified_within?: string;
}

export interface AuthorizeFormResult {
  success: boolean;
  errors: AuthorizeFormErrors;
  params: ParsedAuthorizeParams;
  redirectUri?: string;
  errorRedirectUri?: string;
}

export interface ParsedAuthorizeParams {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string[];
  state: string;
  nonce: string;
  acrValues: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
  prompt: PromptValue;
  verifiedWithin?: number;
  ialValues: string[];
  aalValues: string[];
  requestedAalValue: string;
  identityProofingRequested: boolean;
  ialMaxRequested: boolean;
  facialMatchRequested: boolean;
}

/**
 * Parse duration string (e.g., "30d", "1y") to milliseconds
 */
function parseDuration(value: string): number | null {
  if (!value) return null;

  const match = value.match(/^(\d+)([smhdwMy])$/);
  if (!match) return null;

  const [, numStr, unit] = match;
  const num = parseInt(numStr, 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return num * (multipliers[unit] || 0);
}

/**
 * Parse space-separated values, filtering to valid options
 */
function parseToValues(value: string | undefined, validValues: readonly string[]): string[] {
  if (!value?.trim()) return [];
  return value.split(' ').filter((v) => v && validValues.includes(v));
}

/**
 * Add query parameters to a URL
 */
export function addParamsToUri(uri: string, params: Record<string, string>): string {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Validate OIDC authorization request parameters
 */
export function validateAuthorizeForm(
  params: AuthorizeParams,
  getServiceProvider: (clientId: string) => ServiceProviderConfig | null,
): AuthorizeFormResult {
  const errors: AuthorizeFormErrors = {};

  // Parse acr_values first (needed for scope validation)
  const acrValues = parseToValues(params.acr_values, VALID_AUTHN_CONTEXTS);
  const ialValues = IALS_BY_PRIORITY.filter((ial) => acrValues.includes(ial));
  const aalValues = AALS_BY_PRIORITY.filter((aal) => acrValues.includes(aal));

  // Calculate IAL level from requested values
  const highestIal = ialValues.length > 0 ? ialValues[0] : null;
  const ialLevel = highestIal ? ACR_TO_IAL[highestIal] ?? 1 : 1;
  const identityProofingRequested = ialLevel === 2;
  const ialMaxRequested = ialLevel === 0;
  const facialMatchRequested = ialValues.some((ial) =>
    (FACIAL_MATCH_IAL_CONTEXTS as readonly string[]).includes(ial),
  );

  // Get service provider
  const serviceProvider = params.client_id
    ? getServiceProvider(params.client_id)
    : null;

  // SP defaults to identity proofing if none specified
  const spDefaultsToIdentityProofing =
    ialValues.length === 0 && (serviceProvider?.ial ?? 1) >= 2;
  const identityProofingRequestedOrDefault =
    identityProofingRequested || ialMaxRequested || spDefaultsToIdentityProofing;

  // Parse scope (valid scopes depend on IAL)
  const validScopes = identityProofingRequestedOrDefault ? VALID_SCOPES : VALID_IAL1_SCOPES;
  const scope = parseToValues(params.scope, validScopes as unknown as string[]);

  // Default prompt
  const prompt = (params.prompt || 'select_account') as PromptValue;

  // Calculate requested AAL value
  const requestedAalValue =
    AALS_BY_PRIORITY.find((aal) => aalValues.includes(aal)) || ACR_VALUES.DEFAULT_AAL;

  // Validate acr_values
  if (acrValues.length === 0) {
    errors.acr_values = 'No valid acr_values provided';
  } else if (ialValues.length === 0 && aalValues.length === 0) {
    errors.acr_values = 'Missing IAL context';
  }

  // Validate client_id
  if (!params.client_id) {
    errors.client_id = 'client_id is required';
  } else if (!serviceProvider) {
    errors.client_id = 'Invalid client_id';
  }

  // Validate redirect_uri
  if (!params.redirect_uri) {
    errors.redirect_uri = 'redirect_uri is required';
  } else if (serviceProvider) {
    // Check if redirect_uri is in the allowed list
    const isValidRedirectUri = serviceProvider.redirectUris.some((allowed) => {
      // Exact match or prefix match for wildcard patterns
      return params.redirect_uri === allowed || params.redirect_uri!.startsWith(allowed);
    });
    if (!isValidRedirectUri) {
      errors.redirect_uri = 'redirect_uri is not in the allowed list';
    }
  }

  // Validate response_type
  if (params.response_type !== 'code') {
    errors.response_type = 'response_type must be code';
  }

  // Validate scope
  if (scope.length === 0) {
    errors.scope = 'No valid scope values provided';
  }

  // Validate state
  if (!params.state) {
    errors.state = 'state is required';
  } else if (params.state.length < RANDOM_VALUE_MINIMUM_LENGTH) {
    errors.state = `state must be at least ${RANDOM_VALUE_MINIMUM_LENGTH} characters`;
  }

  // Validate nonce
  if (!params.nonce) {
    errors.nonce = 'nonce is required';
  } else if (params.nonce.length < RANDOM_VALUE_MINIMUM_LENGTH) {
    errors.nonce = `nonce must be at least ${RANDOM_VALUE_MINIMUM_LENGTH} characters`;
  }

  // Validate prompt
  if (!PROMPT_VALUES.includes(prompt as typeof PROMPT_VALUES[number])) {
    errors.prompt = 'Invalid prompt value';
  } else if (prompt === 'login' && !serviceProvider?.allowPromptLogin) {
    errors.prompt = 'prompt=login is not allowed for this service provider';
  }

  // Validate code_challenge_method (only if code_challenge is provided)
  if (params.code_challenge) {
    if (!params.code_challenge_method) {
      errors.code_challenge_method = 'code_challenge_method is required when code_challenge is provided';
    } else if (!CODE_CHALLENGE_METHODS.includes(params.code_challenge_method as typeof CODE_CHALLENGE_METHODS[number])) {
      errors.code_challenge_method = 'code_challenge_method must be S256';
    }
  }

  // Validate privileges
  if (serviceProvider) {
    // IAL2 requires SP to be approved for identity proofing
    if (identityProofingRequested && (serviceProvider.ial ?? 1) < 2) {
      errors.acr_values = 'Service provider is not authorized for identity proofing';
    }

    // IAL MAX requires explicit allow
    if (ialMaxRequested && !serviceProvider.allowIalMax) {
      errors.acr_values = 'Service provider is not authorized for IAL MAX';
    }

    // Facial match requires explicit allow
    if (facialMatchRequested && !serviceProvider.facialMatchAllowed) {
      errors.acr_values = 'Service provider is not authorized for facial match IAL';
    }
  }

  // Validate verified_within (if provided and allowed)
  let verifiedWithin: number | undefined;
  if (params.verified_within) {
    if (!serviceProvider?.verifiedWithinAllowed) {
      errors.verified_within = 'verified_within is not allowed for this service provider';
    } else {
      const parsed = parseDuration(params.verified_within);
      if (parsed === null) {
        errors.verified_within = 'Invalid verified_within format';
      } else if (parsed < MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS * 24 * 60 * 60 * 1000) {
        errors.verified_within = `verified_within must be at least ${MINIMUM_REPROOF_VERIFIED_WITHIN_DAYS} days`;
      } else {
        verifiedWithin = parsed;
      }
    }
  }

  const success = Object.keys(errors).length === 0;

  const parsedParams: ParsedAuthorizeParams = {
    clientId: params.client_id || '',
    redirectUri: params.redirect_uri || '',
    responseType: params.response_type || '',
    scope,
    state: params.state || '',
    nonce: params.nonce || '',
    acrValues,
    codeChallenge: params.code_challenge,
    codeChallengeMethod: params.code_challenge_method,
    prompt,
    verifiedWithin,
    ialValues,
    aalValues,
    requestedAalValue,
    identityProofingRequested,
    ialMaxRequested,
    facialMatchRequested,
  };

  // Build error redirect URI if we can validate the redirect_uri
  let errorRedirectUri: string | undefined;
  if (!success && params.redirect_uri && !errors.redirect_uri && !errors.client_id) {
    errorRedirectUri = addParamsToUri(params.redirect_uri, {
      error: 'invalid_request',
      error_description: Object.values(errors).join(' '),
      state: params.state || '',
    });
  }

  return {
    success,
    errors,
    params: parsedParams,
    errorRedirectUri,
  };
}

/**
 * Build success redirect URI with authorization code
 */
export function buildSuccessRedirectUri(
  redirectUri: string,
  code: string,
  state: string,
): string {
  return addParamsToUri(redirectUri, { code, state });
}
