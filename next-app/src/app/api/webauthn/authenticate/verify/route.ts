/**
 * WebAuthn Authentication Verify Endpoint
 * POST /api/webauthn/authenticate/verify
 * Verifies WebAuthn authentication response for 2FA sign-in
 * 
 * Mirrors: TwoFactorAuthentication::WebauthnVerificationController#confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifyWebAuthnAuthentication,
  type WebAuthnCredential,
} from '@/lib/mfa/webauthn';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  webauthnChallenge?: string;
  mfaVerified?: boolean;
  mfaVerifiedAt?: string;
}

interface VerifyRequest {
  credential: AuthenticationResponseJSON;
  rememberDevice?: boolean;
}

// TODO: Replace with actual session/db lookups
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
  console.log('Getting WebAuthn credentials for user:', userId);
  return [];
}

async function updateCredentialCounter(credentialId: number, newCounter: number): Promise<void> {
  console.log('Updating credential counter:', credentialId, '->', newCounter);
  // TODO: Replace with actual database update
  // credential.update(counter: newCounter)
}

async function setRememberDeviceCookie(
  sessionId: string,
  rememberDevice: boolean,
): Promise<void> {
  if (rememberDevice) {
    console.log('Setting remember device cookie for session:', sessionId);
    // TODO: Create remember device cookie
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  // Check for stored challenge
  if (!session.webauthnChallenge) {
    return NextResponse.json(
      { error: 'No authentication challenge found. Please try again.' },
      { status: 400 },
    );
  }

  // Parse request body
  let body: VerifyRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  if (!body.credential) {
    return NextResponse.json(
      { error: 'Missing credential data' },
      { status: 400 },
    );
  }

  // Get user's WebAuthn credentials
  const credentials = await getUserWebAuthnCredentials(session.userId);

  if (credentials.length === 0) {
    return NextResponse.json(
      { error: 'No WebAuthn credentials found' },
      { status: 404 },
    );
  }

  // Verify the authentication response
  const result = await verifyWebAuthnAuthentication(
    body.credential,
    session.webauthnChallenge,
    credentials,
  );

  if (!result) {
    return NextResponse.json(
      { error: 'WebAuthn authentication failed' },
      { status: 400 },
    );
  }

  // Update counter to prevent replay attacks
  await updateCredentialCounter(result.credential.id, result.newCounter);

  // Clear challenge and mark MFA as verified
  await updateSession(sessionId, {
    webauthnChallenge: undefined,
    mfaVerified: true,
    mfaVerifiedAt: new Date().toISOString(),
  });

  // Handle remember device preference
  if (body.rememberDevice) {
    await setRememberDeviceCookie(sessionId, true);
  }

  return NextResponse.json({
    success: true,
    credentialId: result.credential.credentialId,
    platformAuthenticator: result.credential.platformAuthenticator,
  });
}
