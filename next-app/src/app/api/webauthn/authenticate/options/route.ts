/**
 * WebAuthn Authentication Options Endpoint
 * GET /api/webauthn/authenticate/options
 * Generates WebAuthn authentication challenge for 2FA sign-in
 * 
 * Mirrors: TwoFactorAuthentication::WebauthnVerificationController#show
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  generateWebAuthnAuthenticationOptions,
  type WebAuthnCredential,
} from '@/lib/mfa/webauthn';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  webauthnChallenge?: string;
}

// TODO: Replace with actual session/db lookups
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserWebAuthnCredentials(
  userId: string,
  platformOnly?: boolean,
): Promise<WebAuthnCredential[]> {
  console.log('Getting WebAuthn credentials for user:', userId);
  // TODO: Replace with actual database lookup
  // MfaContext.new(user).webauthn_configurations
  return [];
}

export async function GET(request: NextRequest) {
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

  // Check if platform authenticator is requested
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform') === 'true';

  // Get user's WebAuthn credentials
  const credentials = await getUserWebAuthnCredentials(session.userId, platform);

  if (credentials.length === 0) {
    return NextResponse.json(
      { error: 'No WebAuthn credentials found' },
      { status: 404 },
    );
  }

  // Filter by platform authenticator if requested
  const filteredCredentials = platform
    ? credentials.filter((c) => c.platformAuthenticator)
    : credentials.filter((c) => !c.platformAuthenticator);

  if (filteredCredentials.length === 0) {
    return NextResponse.json(
      { error: 'No matching WebAuthn credentials found' },
      { status: 404 },
    );
  }

  // Generate authentication options
  const { challenge, options } = await generateWebAuthnAuthenticationOptions(filteredCredentials);

  // Store challenge in session for verification
  await updateSession(sessionId, { webauthnChallenge: challenge });

  return NextResponse.json({
    options,
    credentials: filteredCredentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    })),
  });
}
