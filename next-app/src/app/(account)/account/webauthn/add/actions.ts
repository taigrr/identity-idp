/**
 * WebAuthn Setup Server Actions
 * Mirrors: app/forms/webauthn_setup_form.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';
import { randomBytes } from 'crypto';

export interface WebauthnSetupOptions {
  challenge: number[];
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  excludeCredentials: string[];
}

export interface WebauthnSetupResult {
  success: boolean;
  options?: WebauthnSetupOptions;
  error?: string;
}

export interface WebauthnVerifyParams {
  attestationObject: string;
  clientDataJSON: string;
  name: string;
  transports: string[];
  platformAuthenticator: boolean;
}

export interface WebauthnVerifyResult {
  success: boolean;
  error?: string;
}

export async function getWebauthnSetupOptions(
  platformAuthenticator: boolean
): Promise<WebauthnSetupResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Generate a random challenge
  const challenge = randomBytes(32);
  const challengeArray = Array.from(challenge);

  // Store challenge in session for verification
  await sessionManager.update(sessionId, {
    ...session,
    webauthnChallenge: challengeArray,
    webauthnPlatformAuth: platformAuthenticator,
  });

  // Get RP (Relying Party) configuration
  const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
  const rpName = process.env.WEBAUTHN_RP_NAME || 'Login.gov';

  // TODO: Get existing credential IDs from database
  // const existingCredentials = await db.query.webauthnConfigurations.findMany({
  //   where: eq(webauthnConfigurations.userId, session.userId),
  //   columns: { credentialId: true },
  // });
  const excludeCredentials: string[] = [];

  // TODO: Get user info from database
  const userEmail = session.email || 'user@example.gov';
  const userUuid = session.userUuid || session.userId;

  return {
    success: true,
    options: {
      challenge: challengeArray,
      rpId,
      rpName,
      userId: userUuid,
      userName: userEmail,
      userDisplayName: userEmail,
      excludeCredentials,
    },
  };
}

export async function verifyWebauthnSetup(
  params: WebauthnVerifyParams
): Promise<WebauthnVerifyResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const sessionData = session as Record<string, unknown>;
  const storedChallenge = sessionData.webauthnChallenge as number[] | undefined;

  if (!storedChallenge) {
    return { success: false, error: 'WebAuthn setup not initialized' };
  }

  try {
    // Decode attestation response
    const attestationBuffer = Uint8Array.from(atob(params.attestationObject), (c) =>
      c.charCodeAt(0)
    );
    const clientDataBuffer = Uint8Array.from(atob(params.clientDataJSON), (c) => c.charCodeAt(0));

    // Parse client data
    const clientDataText = new TextDecoder().decode(clientDataBuffer);
    const clientData = JSON.parse(clientDataText);

    // Verify the challenge matches
    const receivedChallenge = clientData.challenge;
    const expectedChallenge = btoa(String.fromCharCode(...storedChallenge))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (receivedChallenge !== expectedChallenge) {
      return { success: false, error: 'Challenge mismatch' };
    }

    // Verify origin
    const expectedOrigin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (clientData.origin !== expectedOrigin) {
      console.warn(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`);
      // In development, we might want to be lenient
      if (process.env.NODE_ENV === 'production') {
        return { success: false, error: 'Origin mismatch' };
      }
    }

    // Parse attestation object to get credential data
    // Note: In production, use a proper CBOR decoder library
    // For now, we'll extract a pseudo credential ID
    const credentialId = randomBytes(32).toString('base64url');
    const publicKey = attestationBuffer.slice(0, 65); // Simplified - would need proper CBOR parsing

    // TODO: Save WebAuthn configuration to database
    // await db.insert(webauthnConfigurations).values({
    //   userId: session.userId,
    //   name: params.name,
    //   credentialId,
    //   credentialPublicKey: Buffer.from(publicKey).toString('base64'),
    //   platformAuthenticator: params.platformAuthenticator,
    //   transports: params.transports,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // });

    console.log(`[DEV] WebAuthn credential registered: ${credentialId}`);

    // Clear the challenge from session
    const { webauthnChallenge: _, webauthnPlatformAuth: __, ...cleanSession } = sessionData;
    await sessionManager.update(sessionId, cleanSession);

    return { success: true };
  } catch (err) {
    console.error('WebAuthn verification error:', err);
    return { success: false, error: 'Failed to verify credential' };
  }
}
