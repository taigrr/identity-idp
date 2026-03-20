/**
 * WebAuthn Service
 * Mirrors: app/services/webauthn_configuration.rb
 *
 * Handles WebAuthn/FIDO2 authentication using @simplewebauthn/server
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

// Configuration
const RP_NAME = 'Login.gov';
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000';

export interface WebAuthnCredential {
  id: number;
  userId: number;
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransportFuture[];
  name: string;
  platformAuthenticator: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationChallenge {
  challenge: string;
  options: Awaited<ReturnType<typeof generateRegistrationOptions>>;
}

export interface AuthenticationChallenge {
  challenge: string;
  options: Awaited<ReturnType<typeof generateAuthenticationOptions>>;
}

/**
 * Generates WebAuthn registration options for a new credential
 */
export async function generateWebAuthnRegistrationOptions(
  userUuid: string,
  userEmail: string,
  existingCredentials: WebAuthnCredential[],
  platformAuthenticator: boolean = false
): Promise<RegistrationChallenge> {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(userUuid),
    userName: userEmail,
    userDisplayName: userEmail,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key',
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: platformAuthenticator ? 'platform' : undefined,
    },
  });

  return {
    challenge: options.challenge,
    options,
  };
}

/**
 * Verifies a WebAuthn registration response and returns credential data
 */
export async function verifyWebAuthnRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<{
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  transports: AuthenticatorTransportFuture[];
} | null> {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return null;
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    return {
      credentialId: Buffer.from(credential.id).toString('base64url'),
      credentialPublicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      transports: response.response.transports ?? [],
    };
  } catch (error) {
    console.error('WebAuthn registration verification failed:', error);
    return null;
  }
}

/**
 * Generates WebAuthn authentication options
 */
export async function generateWebAuthnAuthenticationOptions(
  credentials: WebAuthnCredential[]
): Promise<AuthenticationChallenge> {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  });

  return {
    challenge: options.challenge,
    options,
  };
}

/**
 * Verifies a WebAuthn authentication response
 * Returns the matched credential if successful, null otherwise
 */
export async function verifyWebAuthnAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credentials: WebAuthnCredential[]
): Promise<{ credential: WebAuthnCredential; newCounter: number } | null> {
  // Find the credential being used
  const credentialId = response.id;
  const credential = credentials.find(
    (c) => c.credentialId === credentialId
  );

  if (!credential) {
    return null;
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: Buffer.from(credential.credentialId, 'base64url'),
        publicKey: Buffer.from(credential.credentialPublicKey, 'base64'),
        counter: credential.counter,
        transports: credential.transports,
      },
    });

    if (!verification.verified) {
      return null;
    }

    return {
      credential,
      newCounter: verification.authenticationInfo.newCounter,
    };
  } catch (error) {
    console.error('WebAuthn authentication verification failed:', error);
    return null;
  }
}
