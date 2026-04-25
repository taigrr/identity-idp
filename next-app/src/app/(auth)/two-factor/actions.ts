/**
 * Two-Factor Authentication Actions
 * Mirrors: app/controllers/two_factor_authentication/*_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSession, updateSession } from '@/lib/auth/session-manager';
import { authenticateAuthApp } from '@/lib/db/auth-app';
import { validateAndConsumeBackupCode } from '@/lib/db/backup-codes';

const SESSION_COOKIE_NAME = 'session_id';

interface VerifyResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

interface SendCodeResult {
  success: boolean;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function verifyTotpCode(params: {
  code: string;
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

  const { code, rememberDevice } = params;

  // Validate code format
  const cleanCode = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Code must be 6 digits' };
  }

  try {
    const config = await authenticateAuthApp(session.userId, cleanCode);

    if (!config) {
      return { success: false, error: 'Invalid code. Please try again.' };
    }

    // Mark MFA as verified
    await updateSession(sessionId, {
      mfaVerified: true,
      mfaVerifiedAt: new Date().toISOString(),
    });

    // Determine redirect
    const spSession = session.spSession;
    const redirectTo = spSession?.requestUrl || '/account';

    return { success: true, redirectTo };
  } catch (error) {
    console.error('Failed to verify TOTP:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

export async function verifyBackupCode(params: {
  code: string;
}): Promise<VerifyResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const { code } = params;

  if (!code || code.length < 6) {
    return { success: false, error: 'Please enter a valid backup code' };
  }

  try {
    const createdAt = await validateAndConsumeBackupCode(session.userId, code);

    if (!createdAt) {
      return {
        success: false,
        error: 'Invalid backup code. Please try again.',
      };
    }

    // Mark MFA as verified
    await updateSession(sessionId, {
      mfaVerified: true,
      mfaVerifiedAt: new Date().toISOString(),
    });

    // Determine redirect
    const spSession = session.spSession;
    const redirectTo = spSession?.requestUrl || '/account';

    return { success: true, redirectTo };
  } catch (error) {
    console.error('Failed to verify backup code:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

export async function sendSmsCode(params?: {
  deliveryMethod?: 'sms' | 'voice';
}): Promise<SendCodeResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await updateSession(sessionId, {
    twoFactorOtp: otp,
    twoFactorOtpSentAt: Date.now(),
  });

  // TODO: Send actual SMS/voice OTP via Telephony service
  console.log(`[DEV] 2FA OTP: ${otp}`);

  return { success: true };
}

export async function verifySmsCode(params: {
  code: string;
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

  const { code } = params;

  // Validate code format
  const cleanCode = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Code must be 6 digits' };
  }

  // Check code against session
  const storedOtp = session.twoFactorOtp;
  const sentAt = session.twoFactorOtpSentAt;

  if (!storedOtp) {
    return { success: false, error: 'Code not sent. Please resend.' };
  }

  // Check expiry (10 minutes)
  if (sentAt && Date.now() - (sentAt as number) > 10 * 60 * 1000) {
    return { success: false, error: 'Code has expired. Please resend.' };
  }

  // Verify code
  if (cleanCode !== storedOtp) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  // Mark MFA as verified
  await updateSession(sessionId, {
    mfaVerified: true,
    mfaVerifiedAt: new Date().toISOString(),
    twoFactorOtp: undefined,
    twoFactorOtpSentAt: undefined,
  });

  // Determine redirect
  const spSession = session.spSession;
  const redirectTo = spSession?.requestUrl || '/account';

  return { success: true, redirectTo };
}

// MFA method types and exports
export type MfaMethod = 'totp' | 'sms' | 'voice' | 'backup_code' | 'webauthn' | 'piv_cac';

interface MfaOption {
  method: MfaMethod;
  label: string;
  configured: boolean;
}

interface MfaState {
  availableMethods: MfaOption[];
  selectedMethod?: MfaMethod;
}

export async function getAvailableMfaMethods(): Promise<MfaState> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { availableMethods: [] };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { availableMethods: [] };
  }

  // TODO: Query database for configured MFA methods
  // For now, return default set
  return {
    availableMethods: [
      { method: 'totp', label: 'Authentication app', configured: true },
      { method: 'sms', label: 'Text message (SMS)', configured: true },
      { method: 'backup_code', label: 'Backup code', configured: true },
    ],
  };
}

export async function selectMfaMethod(method: MfaMethod): Promise<{ success: boolean; redirectTo?: string }> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false };
  }

  // Store selected method in session
  const session = await getSession(sessionId);
  if (session) {
    await updateSession(sessionId, {
      selectedMfaMethod: method,
    });
  }

  // Redirect based on method
  const redirectMap: Record<MfaMethod, string> = {
    totp: '/two-factor/totp',
    sms: '/two-factor/sms',
    voice: '/two-factor/voice',
    backup_code: '/two-factor/backup-code',
    webauthn: '/two-factor/webauthn',
    piv_cac: '/two-factor/piv-cac',
  };

  return { success: true, redirectTo: redirectMap[method] };
}
