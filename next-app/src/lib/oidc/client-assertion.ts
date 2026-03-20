/**
 * Client Assertion Validation
 * Validates private_key_jwt client authentication
 * Mirrors: validate_client_assertion in openid_connect_token_form.rb
 */

import * as jose from 'jose';
import { ISSUED_AT_LEEWAY_SECONDS, CLIENT_ASSERTION_TYPE } from './constants';
import { getOidcConfig } from './keys';

export interface ClientAssertionValidationResult {
  valid: boolean;
  error?: string;
  errorType?: string;
}

/**
 * Validate a client assertion JWT
 */
export async function validateClientAssertion(
  clientAssertion: string,
  clientAssertionType: string | undefined,
  clientId: string,
  clientCertificates: string[],
  tokenEndpointUrl: string,
): Promise<ClientAssertionValidationResult> {
  // Validate assertion type
  if (clientAssertionType !== CLIENT_ASSERTION_TYPE) {
    return {
      valid: false,
      error: `Invalid client_assertion_type. Expected: ${CLIENT_ASSERTION_TYPE}`,
      errorType: 'invalid_assertion_type',
    };
  }

  // Try each certificate to find a matching one
  let lastError: Error | null = null;
  let payload: jose.JWTPayload | null = null;

  for (const certPem of clientCertificates) {
    try {
      const publicKey = await jose.importSPKI(certPem, 'RS256');

      const { payload: decodedPayload } = await jose.jwtVerify(
        clientAssertion,
        publicKey,
        {
          algorithms: ['RS256'],
          issuer: clientId,
          subject: clientId,
        },
      );

      payload = decodedPayload;
      break;
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }

  if (!payload) {
    return {
      valid: false,
      error: lastError?.message ?? 'Invalid signature',
      errorType: 'invalid_signature',
    };
  }

  // Validate aud claim
  const audValidation = validateAudClaim(payload.aud, tokenEndpointUrl);
  if (!audValidation.valid) {
    return audValidation;
  }

  // Validate iat claim
  const iatValidation = validateIatClaim(payload.iat);
  if (!iatValidation.valid) {
    return iatValidation;
  }

  return { valid: true };
}

/**
 * Validate the aud (audience) claim
 */
function validateAudClaim(
  aud: unknown,
  tokenEndpointUrl: string,
): ClientAssertionValidationResult {
  if (aud === undefined) {
    return {
      valid: false,
      error: 'Missing aud claim',
      errorType: 'invalid_aud',
    };
  }

  const audArray = Array.isArray(aud) ? aud : [aud];
  const normalizedAuds = audArray.map((a) => String(a).replace(/\/$/, ''));
  const normalizedExpected = tokenEndpointUrl.replace(/\/$/, '');

  if (!normalizedAuds.includes(normalizedExpected)) {
    return {
      valid: false,
      error: `Invalid aud claim. Expected: ${tokenEndpointUrl}`,
      errorType: 'invalid_aud',
    };
  }

  return { valid: true };
}

/**
 * Validate the iat (issued at) claim
 */
function validateIatClaim(iat: unknown): ClientAssertionValidationResult {
  // iat is optional
  if (iat === undefined) {
    return { valid: true };
  }

  if (typeof iat !== 'number') {
    return {
      valid: false,
      error: 'Invalid iat claim format',
      errorType: 'invalid_iat',
    };
  }

  const now = Math.floor(Date.now() / 1000);
  // iat should not be in the future (with some leeway)
  if (iat - ISSUED_AT_LEEWAY_SECONDS > now) {
    return {
      valid: false,
      error: 'iat claim is in the future',
      errorType: 'invalid_iat',
    };
  }

  return { valid: true };
}

/**
 * Get the token endpoint URL
 */
export function getTokenEndpointUrl(): string {
  const config = getOidcConfig();
  return `${config.issuer}/api/openid-connect/token`;
}
