/**
 * WebAuthn (Security Key / Passkey) Setup Actions - Signup Flow
 * Mirrors: app/controllers/users/webauthn_setup_controller.rb
 */

'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

export interface WebAuthnSetupData {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  excludeCredentials: string[];
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey: 'preferred' | 'required' | 'discouraged';
    userVerification: 'required' | 'preferred' | 'discouraged';
  };
}

interface SetupResult {
  success: boolean;
  data?: WebAuthnSetupData;
  error?: string;
}

interface ConfirmResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
  mismatch?: boolean;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function initWebAuthnSetup(params: {
  platform?: boolean;
}): Promise<SetupResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { platform = false } = params;

  // TODO: Replace with actual WebAuthn credential creation options
  // 1. Generate challenge
  // 2. Get user info from session
  // 3. Get existing credentials to exclude
  // 4. Return credential creation options

  const mockChallenge = Buffer.from(
    Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
  ).toString('base64');

  return {
    success: true,
    data: {
      challenge: mockChallenge,
      rpId: 'login.gov',
      rpName: 'Login.gov',
      userId: 'user-id-placeholder', // Would be actual user ID
      userName: 'user@example.gov', // Would be actual email
      excludeCredentials: [], // Would be existing credential IDs
      authenticatorSelection: {
        authenticatorAttachment: platform ? 'platform' : 'cross-platform',
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    },
  };
}

export async function confirmWebAuthnSetup(params: {
  attestationObject: string;
  clientDataJson: string;
  authenticatorData?: string;
  name: string;
  platformAuthenticator: boolean;
  transports?: string;
  rememberDevice?: boolean;
}): Promise<ConfirmResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { attestationObject, clientDataJson, name, platformAuthenticator, transports } = params;

  // Validate required fields
  if (!attestationObject || !clientDataJson) {
    return { success: false, error: 'Missing credential data' };
  }

  // TODO: Replace with actual WebAuthn verification
  // 1. Get challenge from session
  // 2. Verify the attestation
  // 3. Extract public key
  // 4. Check for credential ID duplicates
  // 5. Store credential in database

  // Parse transports to detect mismatch
  const transportList = transports ? transports.split(',') : [];
  const isPlatformTransport =
    transportList.includes('internal') || transportList.includes('hybrid');
  const isCrossplatformTransport =
    transportList.includes('usb') ||
    transportList.includes('nfc') ||
    transportList.includes('ble');

  // Detect mismatch between requested and actual authenticator type
  const hasMismatch =
    (platformAuthenticator && isCrossplatformTransport && !isPlatformTransport) ||
    (!platformAuthenticator && isPlatformTransport && !isCrossplatformTransport);

  // TODO: Create webauthn_configuration in database
  // const credential = await db.insert(webauthnConfigurations).values({
  //   userId: session.userId,
  //   name: name || 'My security key',
  //   credentialId: extractedCredentialId,
  //   credentialPublicKey: extractedPublicKey,
  //   platformAuthenticator,
  //   transports: transportList,
  //   createdAt: new Date(),
  // });

  if (hasMismatch) {
    // Store credential ID in session for mismatch page
    return {
      success: true,
      mismatch: true,
      redirectTo: '/signup/mfa/webauthn/mismatch',
    };
  }

  // Determine redirect based on signup flow state
  const hasMoreMfaToSetup = false; // Would check session[:mfa_selections]

  return {
    success: true,
    redirectTo: hasMoreMfaToSetup ? '/signup/mfa' : '/signup/completed',
  };
}
