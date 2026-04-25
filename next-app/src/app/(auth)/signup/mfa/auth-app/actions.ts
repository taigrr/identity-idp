/**
 * TOTP (Auth App) Setup Actions - Signup Flow
 * Mirrors: app/controllers/users/totp_setup_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { generateSecret, generateTotpUri, verifyTotpCode } from '@/lib/mfa/totp';
import {
  createAuthAppConfiguration,
  getUserAuthAppConfigurations,
  confirmAuthAppSetup,
} from '@/lib/db/auth-app';
import { getSession, updateSession } from '@/lib/auth/session-manager';
import { encrypt } from '@/lib/encryption';
import QRCode from 'qrcode';

const SESSION_COOKIE_NAME = 'session_id';

export interface TotpSetupData {
  secret: string;
  qrCodeSvg: string;
  otpAuthUri: string;
}

interface SetupResult {
  success: boolean;
  data?: TotpSetupData;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function initTotpSetup(): Promise<SetupResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  // Generate a new TOTP secret
  const secret = generateSecret();

  // Get user email for the QR code label
  const email = session.email || 'user@example.gov';
  const issuer = 'Login.gov';

  // Generate OTP Auth URI
  const otpAuthUri = generateTotpUri(secret, email, issuer);

  // Generate QR code SVG
  let qrCodeSvg: string;
  try {
    qrCodeSvg = await QRCode.toString(otpAuthUri, {
      type: 'svg',
      width: 200,
      margin: 2,
    });
  } catch {
    // Fallback placeholder if QR generation fails
    qrCodeSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12">QR Code</text>
      <text x="100" y="120" text-anchor="middle" font-size="8">${secret}</text>
    </svg>`;
  }

  // Store secret in session for verification step
  await updateSession(sessionId, {
    totpSetupSecret: secret,
  });

  return {
    success: true,
    data: {
      secret,
      qrCodeSvg,
      otpAuthUri,
    },
  };
}

export async function verifyTotpSetup(params: {
  code: string;
  name: string;
  rememberDevice?: boolean;
}): Promise<VerifyResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const { code, name } = params;

  // Validate code format
  const cleanCode = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Code must be 6 digits' };
  }

  // Get the secret from session
  const secret = session.totpSetupSecret;
  if (!secret) {
    return { success: false, error: 'TOTP setup not initialized. Please start again.' };
  }

  // Verify the TOTP code
  const timestamp = await confirmAuthAppSetup(secret, cleanCode);
  if (timestamp === null) {
    return { success: false, error: 'Invalid verification code. Please try again.' };
  }

  // Check for duplicate name
  const existingConfigs = await getUserAuthAppConfigurations(session.userId);
  const configName = name || 'My authentication app';
  if (existingConfigs.some((c) => c.name === configName)) {
    return {
      success: false,
      error: 'You already have an authentication app with this name',
    };
  }

  // Create auth app configuration in database
  await createAuthAppConfiguration({
    userId: session.userId,
    otpSecretKey: secret,
    name: configName,
  });

  // Clear the setup secret from session
  await updateSession(sessionId, {
    totpSetupSecret: undefined,
  });

  // Check if more MFA methods need to be set up
  const mfaSelections = session.mfaSelections || [];
  const completedMfa = session.completedMfa || [];
  completedMfa.push('auth_app');

  await updateSession(sessionId, {
    completedMfa,
  });

  const remainingMfa = mfaSelections.filter(
    (m: string) => !completedMfa.includes(m)
  );
  const hasMoreMfaToSetup = remainingMfa.length > 0;

  return {
    success: true,
    redirectTo: hasMoreMfaToSetup ? '/signup/mfa' : '/signup/completed',
  };
}

export async function cancelTotpSetup(): Promise<{ success: boolean }> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false };
  }

  // Clear the setup secret from session
  await updateSession(sessionId, {
    totpSetupSecret: undefined,
  });

  return { success: true };
}
