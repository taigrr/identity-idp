/**
 * ID Token Builder
 * Builds JWT ID tokens for OIDC responses
 * Mirrors: app/services/id_token_builder.rb
 */

import * as jose from 'jose';
import { createHash } from 'crypto';
import { getPrimaryKeyPair, getOidcConfig } from './keys';

const NUM_BYTES_FIRST_128_BITS = 128 / 8;

export interface IdTokenClaims {
  // Standard OIDC claims
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  nbf: number;
  nonce?: string;
  jti: string;

  // Login.gov specific claims
  acr?: string;
  at_hash?: string;
  c_hash?: string;

  // User info claims (filtered by scope)
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  address?: {
    formatted: string;
    street_address: string;
    locality: string;
    region: string;
    postal_code: string;
  };
  phone?: string;
  phone_verified?: boolean;
  social_security_number?: string;
  verified_at?: number;
  locale?: string;
  all_emails?: string[];
  ial?: string;
  aal?: string;

  // X509 claims
  x509_subject?: string;
  x509_issuer?: string;
  x509_presented?: boolean;
}

export interface IdTokenBuilderOptions {
  subject: string;
  audience: string;
  nonce?: string;
  accessToken: string;
  code: string;
  acr?: string;
  userInfo?: Partial<IdTokenClaims>;
  ttl?: number;
  now?: Date;
}

/**
 * Hash a token for at_hash or c_hash claims
 * Takes the left-most 128 bits of the SHA-256 hash
 */
function hashToken(token: string): string {
  const hash = createHash('sha256').update(token).digest();
  const leftmost128Bits = hash.subarray(0, NUM_BYTES_FIRST_128_BITS);
  return Buffer.from(leftmost128Bits)
    .toString('base64url')
    .replace(/=+$/, '');
}

/**
 * Generate a secure random JTI (JWT ID)
 */
function generateJti(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Build and sign an ID token
 */
export async function buildIdToken(
  options: IdTokenBuilderOptions,
): Promise<{ token: string; ttl: number }> {
  const config = getOidcConfig();
  const keyPair = await getPrimaryKeyPair();
  const now = options.now ?? new Date();
  const ttl = options.ttl ?? config.tokenTtl;
  const nowSeconds = Math.floor(now.getTime() / 1000);

  const claims: IdTokenClaims = {
    // Required claims
    sub: options.subject,
    iss: config.issuer,
    aud: options.audience,
    exp: nowSeconds + ttl,
    iat: nowSeconds,
    nbf: nowSeconds,
    jti: generateJti(),

    // Optional claims
    ...(options.nonce && { nonce: options.nonce }),
    ...(options.acr && { acr: options.acr }),

    // Token hashes
    at_hash: hashToken(options.accessToken),
    c_hash: hashToken(options.code),

    // User info (filtered by scope)
    ...options.userInfo,
  };

  const token = await new jose.SignJWT(claims as jose.JWTPayload)
    .setProtectedHeader({ alg: 'RS256', kid: keyPair.kid })
    .sign(keyPair.privateKey);

  return { token, ttl };
}

/**
 * Verify an ID token (for logout flow id_token_hint)
 */
export async function verifyIdToken(
  token: string,
  options?: {
    audience?: string;
    ignoreExpiration?: boolean;
  },
): Promise<jose.JWTPayload | null> {
  try {
    const config = getOidcConfig();
    const keyPair = await getPrimaryKeyPair();

    const verifyOptions: jose.JWTVerifyOptions = {
      issuer: config.issuer,
      algorithms: ['RS256'],
    };

    if (options?.audience) {
      verifyOptions.audience = options.audience;
    }

    // For id_token_hint in logout, we may want to accept expired tokens
    if (options?.ignoreExpiration) {
      // jose doesn't have a direct option for this, so we catch and check
      try {
        const { payload } = await jose.jwtVerify(
          token,
          keyPair.publicKey,
          verifyOptions,
        );
        return payload;
      } catch (err) {
        if (err instanceof jose.errors.JWTExpired) {
          // Decode without verification for expired token
          const decoded = jose.decodeJwt(token);
          // Still verify signature manually
          const { payload } = await jose.jwtVerify(token, keyPair.publicKey, {
            ...verifyOptions,
            currentDate: new Date((decoded.exp as number) * 1000 - 1000),
          });
          return payload;
        }
        throw err;
      }
    }

    const { payload } = await jose.jwtVerify(
      token,
      keyPair.publicKey,
      verifyOptions,
    );
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a secure access token
 */
export function generateAccessToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Generate an authorization code (session UUID in Rails)
 */
export function generateAuthorizationCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}
