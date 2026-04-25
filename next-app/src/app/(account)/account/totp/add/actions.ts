/**
 * TOTP Setup Server Actions
 * Mirrors: app/forms/totp_setup_form.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';
import { generateSecret, verifyTotpCode, generateTotpUri } from '@/lib/mfa/totp';
import { toDataURL } from 'qrcode';

export interface TotpSetupData {
  secret: string;
  qrCodeSvg: string;
  issuer: string;
}

export interface TotpSetupResult {
  success: boolean;
  data?: TotpSetupData;
  error?: string;
}

export interface TotpVerifyResult {
  success: boolean;
  error?: string;
}

export async function setupTotp(): Promise<TotpSetupResult> {
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

  // Generate a new TOTP secret
  const secret = generateSecret();
  const issuer = process.env.TOTP_ISSUER || 'Login.gov';

  // Store secret in session for verification
  await sessionManager.update(sessionId, {
    ...session,
    totpSetupSecret: secret,
  });

  // TODO: Get user's email from database
  const userEmail = session.email || 'user@example.gov';

  // Generate QR code
  const uri = generateTotpUri(secret, userEmail, issuer);
  const qrCodeSvg = await toDataURL(uri);

  return {
    success: true,
    data: {
      secret,
      qrCodeSvg,
      issuer,
    },
  };
}

export async function verifyTotpSetup(params: {
  code: string;
  name: string;
}): Promise<TotpVerifyResult> {
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

  const secret = (session as Record<string, unknown>).totpSetupSecret as string | undefined;
  if (!secret) {
    return { success: false, error: 'TOTP setup not initialized' };
  }

  // Verify the code
  const timestamp = verifyTotpCode(secret, params.code);
  if (timestamp === null) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  // TODO: Save TOTP configuration to database
  // const authAppConfig = await db.insert(authAppConfigurations).values({
  //   userId: session.userId,
  //   name: params.name,
  //   otpSecretKey: secret, // Should be encrypted
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });

  // Clear the setup secret from session
  const { totpSetupSecret: _, ...cleanSession } = session as Record<string, unknown>;
  await sessionManager.update(sessionId, cleanSession);

  return { success: true };
}
