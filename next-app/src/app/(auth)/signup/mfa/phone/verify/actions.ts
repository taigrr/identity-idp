/**
 * Phone Verification Actions - Signup Flow
 * Mirrors: app/controllers/users/phone_setup_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSession, updateSession } from '@/lib/auth/session-manager';
import {
  createOrUpdatePhoneConfiguration,
  confirmPhoneConfiguration,
} from '@/lib/db/phones';

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

export async function sendVerificationCode(params: {
  phone: string;
  deliveryMethod: 'sms' | 'voice';
}): Promise<SendCodeResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const { phone, deliveryMethod } = params;

  // Validate phone format
  const phoneRegex = /^\+?[\d\s()-]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, error: 'Please enter a valid phone number' };
  }

  try {
    // Create or update phone configuration
    const phoneConfig = await createOrUpdatePhoneConfiguration(
      session.userId,
      phone,
      deliveryMethod === 'sms' ? 0 : 1
    );

    // Generate and store OTP in session
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await updateSession(sessionId, {
      phoneVerificationOtp: otp,
      phoneVerificationPhoneId: phoneConfig.id,
      phoneVerificationSentAt: Date.now(),
    });

    // TODO: Send actual SMS/voice OTP via Telephony service
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

export async function verifyPhoneCode(params: {
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

  // Validate code format
  const cleanCode = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Code must be 6 digits' };
  }

  // Check code against session
  const storedOtp = session.phoneVerificationOtp;
  const phoneId = session.phoneVerificationPhoneId;
  const sentAt = session.phoneVerificationSentAt;

  if (!storedOtp || !phoneId) {
    return { success: false, error: 'Verification not started. Please resend code.' };
  }

  // Check expiry (10 minutes)
  if (sentAt && Date.now() - (sentAt as number) > 10 * 60 * 1000) {
    return { success: false, error: 'Code has expired. Please resend.' };
  }

  // Verify code
  if (cleanCode !== storedOtp) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  try {
    // Confirm phone configuration
    await confirmPhoneConfiguration(session.userId, phoneId as number);

    // Clear verification state from session
    await updateSession(sessionId, {
      phoneVerificationOtp: undefined,
      phoneVerificationPhoneId: undefined,
      phoneVerificationSentAt: undefined,
    });

    // Update completed MFA
    const completedMfa = (session.completedMfa as string[]) || [];
    completedMfa.push('phone');

    await updateSession(sessionId, { completedMfa });

    // Check if more MFA to setup
    const mfaSelections = (session.mfaSelections as string[]) || [];
    const remainingMfa = mfaSelections.filter((m) => !completedMfa.includes(m));

    return {
      success: true,
      redirectTo: remainingMfa.length > 0 ? '/signup/mfa' : '/signup/completed',
    };
  } catch (error) {
    console.error('Failed to verify phone:', error);
    return { success: false, error: 'Failed to verify phone number' };
  }
}

export async function resendCode(): Promise<SendCodeResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await updateSession(sessionId, {
    phoneVerificationOtp: otp,
    phoneVerificationSentAt: Date.now(),
  });

  // TODO: Send actual SMS/voice OTP via Telephony service
  console.log(`[DEV] Resent OTP: ${otp}`);

  return { success: true };
}

// Aliases for backwards compatibility with page imports
export async function verifyPhoneOtp(params: {
  code: string;
  rememberDevice?: boolean;
}): Promise<VerifyResult> {
  return verifyPhoneCode(params);
}

export async function resendPhoneOtp(params?: {
  otpDeliveryPreference?: 'sms' | 'voice';
}): Promise<SendCodeResult> {
  return resendCode();
}
