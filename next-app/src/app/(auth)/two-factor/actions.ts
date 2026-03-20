/**
 * 2FA Options page - Select MFA method
 * Mirrors: app/controllers/two_factor_authentication/options_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionManager, type SessionData } from '@/lib/auth/session-manager';

export type MfaMethod = 'totp' | 'sms' | 'voice' | 'webauthn' | 'backup_code';

export interface MfaOption {
  method: MfaMethod;
  label: string;
  configured: boolean;
}

export interface TwoFactorState {
  userId?: string;
  userUuid?: string;
  availableMethods: MfaOption[];
  error?: string;
}

export async function getAvailableMfaMethods(): Promise<TwoFactorState> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    redirect('/login');
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    redirect('/login');
  }

  // TODO: Fetch actual MFA configurations from database
  // For now, return mock data
  const availableMethods: MfaOption[] = [
    { method: 'totp', label: 'Authentication app', configured: false },
    { method: 'sms', label: 'Text message (SMS)', configured: false },
    { method: 'voice', label: 'Phone call', configured: false },
    { method: 'webauthn', label: 'Security key', configured: false },
    { method: 'backup_code', label: 'Backup codes', configured: false },
  ];

  return {
    userId: session.userId,
    userUuid: session.userUuid,
    availableMethods,
  };
}

export async function selectMfaMethod(method: MfaMethod): Promise<void> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    redirect('/login');
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    redirect('/login');
  }

  // Store selected method in session
  await sessionManager.update(sessionId, {
    ...session,
    mfaMethod: method,
  } as SessionData);

  // Redirect to appropriate verification page
  switch (method) {
    case 'totp':
      redirect('/two-factor/totp');
    case 'sms':
    case 'voice':
      redirect('/two-factor/otp');
    case 'webauthn':
      redirect('/two-factor/webauthn');
    case 'backup_code':
      redirect('/two-factor/backup-code');
    default:
      redirect('/two-factor');
  }
}

// OTP Verification Actions
export interface OtpActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    code?: string;
  };
}

export async function verifyOtp(
  prevState: OtpActionState,
  formData: FormData
): Promise<OtpActionState> {
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

  const code = formData.get('code') as string;
  const method = formData.get('method') as string;
  const rememberDevice = formData.get('rememberDevice') === 'true';

  // Validate code format
  if (!code || !/^\d{6}$/.test(code)) {
    return {
      success: false,
      fieldErrors: { code: 'Please enter a valid 6-digit code' },
    };
  }

  // TODO: Verify OTP against stored value
  // In a real implementation, this would:
  // 1. Get the expected OTP from session or database
  // 2. Verify it matches and hasn't expired
  // 3. Mark the user as fully authenticated

  // Mock verification - accept code "123456" for testing
  const sessionData = session as Record<string, unknown>;
  const expectedOtp = sessionData.pendingOtp as string | undefined;

  if (expectedOtp && code !== expectedOtp && code !== '123456') {
    return {
      success: false,
      fieldErrors: { code: 'Invalid code. Please try again.' },
    };
  }

  // Mark user as fully authenticated
  await sessionManager.update(sessionId, {
    ...session,
    fullyAuthenticated: true,
    authenticatedAt: Date.now(),
    rememberDevice,
  } as SessionData);

  // Clear pending OTP
  const { pendingOtp: _, ...cleanSession } = sessionData;
  await sessionManager.update(sessionId, cleanSession as SessionData);

  redirect('/account');
}

export async function resendOtp(
  prevState: OtpActionState,
  formData: FormData
): Promise<OtpActionState> {
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

  const method = formData.get('method') as string;

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in session
  await sessionManager.update(sessionId, {
    ...session,
    pendingOtp: otp,
    otpSentAt: Date.now(),
  } as SessionData);

  // TODO: Send OTP via SMS or voice call
  console.log(`[DEV] Resent OTP via ${method}: ${otp}`);

  return { success: true };
}

// Backup Code Verification Actions
export interface BackupCodeActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    code?: string;
  };
}

export async function verifyBackupCode(
  prevState: BackupCodeActionState,
  formData: FormData
): Promise<BackupCodeActionState> {
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

  const code = formData.get('code') as string;

  // Validate code format (xxxx-xxxx-xxxx)
  const cleanCode = code.replace(/-/g, '').toUpperCase();
  if (!cleanCode || cleanCode.length !== 12) {
    return {
      success: false,
      fieldErrors: { code: 'Please enter a valid backup code' },
    };
  }

  // TODO: Verify backup code against stored hashes
  // In a real implementation:
  // 1. Get user's backup codes from database
  // 2. Compare hash of submitted code against stored hashes
  // 3. If match, mark code as used and authenticate user

  // Mock verification - accept any properly formatted code
  console.log(`[DEV] Backup code verified: ${cleanCode}`);

  // Mark user as fully authenticated
  await sessionManager.update(sessionId, {
    ...session,
    fullyAuthenticated: true,
    authenticatedAt: Date.now(),
    authenticatedVia: 'backup_code',
  } as SessionData);

  redirect('/account');
}
