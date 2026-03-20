/**
 * OIDC Key Management
 * Manages RSA keys for JWT signing and JWK Set generation
 * Mirrors: Rails AppArtifacts.store.oidc_primary_private_key
 */

import * as jose from 'jose';

export interface OidcKeyPair {
  privateKey: jose.KeyLike;
  publicKey: jose.KeyLike;
  kid: string;
}

let keyPairs: OidcKeyPair[] | null = null;
let primaryKeyPair: OidcKeyPair | null = null;

/**
 * Get OIDC configuration from environment
 */
export function getOidcConfig() {
  return {
    issuer: process.env.OIDC_ISSUER ?? 'http://localhost:3000',
    privateKeyPem: process.env.OIDC_PRIVATE_KEY,
    publicKeyPem: process.env.OIDC_PUBLIC_KEY,
    // Session timeout in seconds (default 15 minutes)
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT ?? '900', 10),
    // Token TTL in seconds (default 5 minutes)
    tokenTtl: parseInt(process.env.TOKEN_TTL ?? '300', 10),
  };
}

/**
 * Generate a new RSA key pair for development/testing
 */
export async function generateKeyPair(): Promise<OidcKeyPair> {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
    extractable: true,
  });

  const jwk = await jose.exportJWK(publicKey);
  const kid = await jose.calculateJwkThumbprint(jwk);

  return { privateKey, publicKey, kid };
}

/**
 * Import an RSA key pair from PEM strings
 * Note: If only private key is provided, public key must be derived externally
 * or both keys should be provided.
 */
export async function importKeyPair(
  privateKeyPem: string,
  publicKeyPem?: string,
): Promise<OidcKeyPair> {
  const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

  // If public key provided, use it; otherwise we need to extract from PEM
  let publicKey: jose.KeyLike;
  if (publicKeyPem) {
    publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
  } else {
    // Extract public key from private key PEM using crypto module
    const crypto = await import('crypto');
    const privateKeyObject = crypto.createPrivateKey(privateKeyPem);
    // Create public key from private key object
    const publicKeyObject = crypto.createPublicKey(privateKeyObject);
    const publicKeyPemDerived = publicKeyObject
      .export({ type: 'spki', format: 'pem' })
      .toString();
    publicKey = await jose.importSPKI(publicKeyPemDerived, 'RS256');
  }

  const jwk = await jose.exportJWK(publicKey);
  const kid = await jose.calculateJwkThumbprint(jwk);

  return { privateKey, publicKey, kid };
}

/**
 * Initialize the key management system
 * In production, keys come from environment variables
 * In development, we generate keys on the fly
 */
export async function initializeKeys(): Promise<void> {
  const config = getOidcConfig();

  if (config.privateKeyPem) {
    // Production: use configured keys
    const keyPair = await importKeyPair(
      config.privateKeyPem,
      config.publicKeyPem,
    );
    keyPairs = [keyPair];
    primaryKeyPair = keyPair;
  } else {
    // Development: generate a key pair
    console.warn(
      'OIDC keys not configured, generating development keys. DO NOT use in production.',
    );
    const keyPair = await generateKeyPair();
    keyPairs = [keyPair];
    primaryKeyPair = keyPair;
  }
}

/**
 * Get the primary key pair for signing
 */
export async function getPrimaryKeyPair(): Promise<OidcKeyPair> {
  if (!primaryKeyPair) {
    await initializeKeys();
  }
  return primaryKeyPair!;
}

/**
 * Get all key pairs (for JWKS endpoint)
 */
export async function getAllKeyPairs(): Promise<OidcKeyPair[]> {
  if (!keyPairs) {
    await initializeKeys();
  }
  return keyPairs!;
}

/**
 * Generate JWKS (JSON Web Key Set) for the certs endpoint
 */
export async function generateJwks(): Promise<jose.JSONWebKeySet> {
  const pairs = await getAllKeyPairs();
  const keys: jose.JWK[] = [];

  for (const pair of pairs) {
    const jwk = await jose.exportJWK(pair.publicKey);
    keys.push({
      ...jwk,
      kid: pair.kid,
      alg: 'RS256',
      use: 'sig',
    });
  }

  return { keys };
}

/**
 * Reset keys (for testing)
 */
export function resetKeys(): void {
  keyPairs = null;
  primaryKeyPair = null;
}
