/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Mirrors: Rails code_verifier validation in openid_connect_token_form.rb
 */

import { createHash } from 'crypto';

/**
 * Generate a code challenge from a code verifier using S256 method
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = createHash('sha256').update(codeVerifier).digest();
  return hash.toString('base64url');
}

/**
 * Verify a code verifier against a stored code challenge
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  storedChallenge: string,
): boolean {
  const givenChallenge = generateCodeChallenge(codeVerifier);

  // Normalize both challenges (remove padding)
  const normalizedGiven = removeBase64Padding(givenChallenge);
  const normalizedStored = removeBase64Padding(storedChallenge);

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(normalizedGiven, normalizedStored);
}

/**
 * Generate a cryptographically secure code verifier
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Remove base64 padding (=) from a string
 */
function removeBase64Padding(data: string): string {
  return data.replace(/=+$/, '');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
