/**
 * Add Phone Server Actions
 * Mirrors: app/forms/new_phone_form.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';
import { generateOtp } from '@/lib/mfa/backup-codes';

export interface AddPhoneParams {
  phone: string;
  internationalCode: string;
  deliveryPreference: 'sms' | 'voice';
  makeDefault: boolean;
}

export interface AddPhoneResult {
  success: boolean;
  error?: string;
}

export async function addPhone(params: AddPhoneParams): Promise<AddPhoneResult> {
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

  // Validate phone number format
  const phoneNumber = params.phone.replace(/\D/g, '');
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    return { success: false, error: 'Please enter a valid phone number' };
  }

  // Format full phone number
  const fullPhoneNumber = `${params.internationalCode}${phoneNumber}`;

  // TODO: Check if phone number already exists for this user
  // const existingPhone = await db.query.phoneConfigurations.findFirst({
  //   where: and(
  //     eq(phoneConfigurations.userId, session.userId),
  //     eq(phoneConfigurations.phone, fullPhoneNumber)
  //   )
  // });
  // if (existingPhone) {
  //   return { success: false, error: 'This phone number is already registered to your account' };
  // }

  // Generate OTP
  const otp = generateOtp(6);

  // Store unconfirmed phone in session
  await sessionManager.update(sessionId, {
    ...session,
    unconfirmedPhone: fullPhoneNumber,
    phoneDeliveryPreference: params.deliveryPreference,
    phoneMakeDefault: params.makeDefault,
    phoneOtp: otp,
    phoneOtpSentAt: Date.now(),
  });

  // TODO: Send OTP via SMS or voice
  // if (params.deliveryPreference === 'sms') {
  //   await sendSms(fullPhoneNumber, `Your Login.gov verification code is: ${otp}`);
  // } else {
  //   await sendVoiceCall(fullPhoneNumber, otp);
  // }

  console.log(`[DEV] Phone OTP for ${fullPhoneNumber}: ${otp}`);

  return { success: true };
}

export async function verifyPhoneOtp(code: string): Promise<AddPhoneResult> {
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

  const sessionData = session as Record<string, unknown>;
  const expectedOtp = sessionData.phoneOtp as string | undefined;
  const unconfirmedPhone = sessionData.unconfirmedPhone as string | undefined;

  if (!expectedOtp || !unconfirmedPhone) {
    return { success: false, error: 'Phone verification not initialized' };
  }

  // Check OTP expiration (5 minutes)
  const otpSentAt = sessionData.phoneOtpSentAt as number | undefined;
  if (otpSentAt && Date.now() - otpSentAt > 5 * 60 * 1000) {
    return { success: false, error: 'Code expired. Please request a new code.' };
  }

  // Verify OTP
  if (code !== expectedOtp) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  // TODO: Save phone configuration to database
  // await db.insert(phoneConfigurations).values({
  //   userId: session.userId,
  //   phone: unconfirmedPhone,
  //   deliveryPreference: sessionData.phoneDeliveryPreference,
  //   isDefault: sessionData.phoneMakeDefault,
  //   confirmedAt: new Date(),
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });

  // Clear session data
  const {
    unconfirmedPhone: _,
    phoneDeliveryPreference: __,
    phoneMakeDefault: ___,
    phoneOtp: ____,
    phoneOtpSentAt: _____,
    ...cleanSession
  } = sessionData;
  await sessionManager.update(sessionId, cleanSession);

  return { success: true };
}

export async function resendPhoneOtp(): Promise<AddPhoneResult> {
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

  const sessionData = session as Record<string, unknown>;
  const unconfirmedPhone = sessionData.unconfirmedPhone as string | undefined;
  const deliveryPreference = sessionData.phoneDeliveryPreference as 'sms' | 'voice' | undefined;

  if (!unconfirmedPhone) {
    return { success: false, error: 'Phone verification not initialized' };
  }

  // Generate new OTP
  const otp = generateOtp(6);

  await sessionManager.update(sessionId, {
    ...sessionData,
    phoneOtp: otp,
    phoneOtpSentAt: Date.now(),
  });

  // TODO: Send OTP via SMS or voice
  console.log(`[DEV] Resent phone OTP for ${unconfirmedPhone}: ${otp}`);

  return { success: true };
}
