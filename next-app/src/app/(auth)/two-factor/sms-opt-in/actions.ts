'use server';

/**
 * SMS Opt-In Actions
 * Mirrors: app/controllers/two_factor_authentication/sms_opt_in_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
}

interface PhoneOptOutInfo {
  uuid: string;
  phoneNumber: string;
  formattedPhone: string;
  optedOutAt: string;
}

interface OptInResult {
  success: boolean;
  error?: string;
  alreadyOptedInRecently?: boolean;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123' };
}

async function getPhoneOptOutInfo(optOutUuid: string): Promise<PhoneOptOutInfo | null> {
  // TODO: Look up phone opt-out record
  console.log('Getting phone opt-out info:', optOutUuid);
  return {
    uuid: optOutUuid,
    phoneNumber: '+15551234567',
    formattedPhone: '(555) 123-4567',
    optedOutAt: new Date().toISOString(),
  };
}

async function optInPhoneNumber(phoneNumber: string): Promise<OptInResult> {
  // TODO: Call Pinpoint/SNS to opt phone number back in
  console.log('Opting in phone number:', phoneNumber);
  return { success: true };
}

async function recordOptIn(optOutUuid: string): Promise<void> {
  // TODO: Update phone_number_opt_outs record
  console.log('Recording opt-in for:', optOutUuid);
}

async function hasOtherAuthMethods(userId: string, excludePhoneId?: string): Promise<boolean> {
  // TODO: Check if user has other MFA methods
  return true;
}

async function isNewUser(userId: string): Promise<boolean> {
  // TODO: Check if user has any MFA methods configured
  return false;
}

/**
 * Get SMS opt-in page data
 */
export async function getSmsOptInData(optOutUuid: string): Promise<{
  phoneInfo: PhoneOptOutInfo | null;
  hasOtherMethods: boolean;
  isNewUser: boolean;
  cancelUrl: string;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);

  const phoneInfo = await getPhoneOptOutInfo(optOutUuid);
  if (!phoneInfo) {
    redirect('/two-factor');
  }

  let hasOtherMethods = false;
  let newUser = false;
  let cancelUrl = '/sign-out';

  if (session?.userId) {
    [hasOtherMethods, newUser] = await Promise.all([
      hasOtherAuthMethods(session.userId),
      isNewUser(session.userId),
    ]);

    cancelUrl = session.mfaVerified ? '/account' : '/sign-out';
  }

  return {
    phoneInfo,
    hasOtherMethods,
    isNewUser: newUser,
    cancelUrl,
  };
}

/**
 * Opt phone number back in to SMS
 */
export async function optInToSms(
  optOutUuid: string,
): Promise<{ success: boolean; error?: string; alreadyOptedIn?: boolean }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const phoneInfo = await getPhoneOptOutInfo(optOutUuid);
  if (!phoneInfo) {
    return { success: false, error: 'Invalid opt-out record' };
  }

  const result = await optInPhoneNumber(phoneInfo.phoneNumber);

  if (result.success) {
    await recordOptIn(optOutUuid);
    // Redirect to OTP delivery selection
    redirect('/two-factor/sms?delivery_preference=sms');
  }

  if (result.alreadyOptedInRecently) {
    return {
      success: false,
      alreadyOptedIn: true,
      error: 'This phone number was recently opted in. Please try again later.',
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to opt in. Please try again.',
  };
}
