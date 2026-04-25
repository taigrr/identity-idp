/**
 * Phone Setup Actions - Signup Flow
 * Mirrors: app/controllers/users/phone_setup_controller.rb
 */

'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface PhoneSetupResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

interface SendOtpResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getPhoneSetupData(): Promise<{
  success: boolean;
  data?: {
    maxPhonesReached: boolean;
    existingPhones: string[];
    defaultCountryCode: string;
    vendorOutage: boolean;
  };
  error?: string;
}> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  // TODO: Replace with actual database queries
  // 1. Get user's existing phone configurations
  // 2. Check max phones limit
  // 3. Check for vendor outages

  return {
    success: true,
    data: {
      maxPhonesReached: false,
      existingPhones: [],
      defaultCountryCode: 'US',
      vendorOutage: false,
    },
  };
}

export async function submitPhoneSetup(params: {
  phone: string;
  internationalCode: string;
  otpDeliveryPreference: 'sms' | 'voice';
  makeDefault?: boolean;
}): Promise<PhoneSetupResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { phone, internationalCode, otpDeliveryPreference } = params;

  // Validate phone number format
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid phone number' };
  }

  // Format full phone number
  const fullPhone = `+${internationalCode}${cleanPhone}`;

  // TODO: Check for duplicate phone numbers
  // const existingPhones = await getExistingPhones(userId);
  // if (existingPhones.includes(fullPhone)) {
  //   return { success: false, error: 'This phone number is already registered to your account' };
  // }

  // TODO: Validate phone capabilities
  // - Check if number supports SMS/voice based on preference
  // - Use phone capabilities API

  // TODO: Verify reCAPTCHA if enabled
  // if (FeatureManagement.phone_recaptcha_enabled?) {
  //   const recaptchaResult = await verifyRecaptcha(params.recaptchaToken);
  //   if (!recaptchaResult.success) {
  //     return { success: false, error: 'Verification failed. Please try again.' };
  //   }
  // }

  // Store unconfirmed phone in session for OTP verification
  // TODO: Actually store in session/redis
  // session.unconfirmed_phone = fullPhone;
  // session.phone_type = phoneInfo.type;

  return {
    success: true,
    redirectTo: `/signup/mfa/phone/verify?delivery=${otpDeliveryPreference}`,
  };
}

export async function sendPhoneOtp(params: {
  otpDeliveryPreference: 'sms' | 'voice';
}): Promise<SendOtpResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  // TODO: Replace with actual OTP sending
  // 1. Get unconfirmed phone from session
  // 2. Generate OTP code
  // 3. Send via SMS or voice call
  // 4. Store OTP for verification
  // 5. Track analytics

  return {
    success: true,
    redirectTo: '/signup/mfa/phone/verify',
  };
}

export async function verifyPhoneOtp(params: {
  code: string;
  rememberDevice?: boolean;
}): Promise<PhoneSetupResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { code } = params;

  // Validate OTP format
  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    return { success: false, error: 'Please enter a 6-digit code' };
  }

  // TODO: Replace with actual OTP verification
  // 1. Get stored OTP from redis/session
  // 2. Compare codes
  // 3. Check rate limiting
  // 4. If valid, create phone_configuration record
  // 5. Send confirmation email
  // 6. Clear session data

  // Mock validation
  const isValid = cleanCode.length === 6;

  if (!isValid) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  // TODO: Create phone configuration in database
  // await db.insert(phoneConfigurations).values({
  //   userId: session.userId,
  //   phone: session.unconfirmedPhone,
  //   deliveryPreference: session.otpDeliveryPreference,
  //   confirmedAt: new Date(),
  // });

  // Determine redirect based on signup flow state
  const hasMoreMfaToSetup = false; // Would check session[:mfa_selections]

  return {
    success: true,
    redirectTo: hasMoreMfaToSetup ? '/signup/mfa' : '/signup/completed',
  };
}

export async function resendPhoneOtp(params: {
  otpDeliveryPreference: 'sms' | 'voice';
}): Promise<SendOtpResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  // TODO: Check rate limiting before resending
  // TODO: Generate new OTP and send

  return {
    success: true,
    redirectTo: `/signup/mfa/phone/verify?resent=true`,
  };
}
