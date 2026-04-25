/**
 * Phone Number Info
 * Mirrors: lib/telephony/phone_number_info.rb
 */

import { getSmsSender } from './sms-sender';
import type { PhoneNumberInfo } from './types';

/**
 * Get phone number information from Pinpoint
 */
export async function getPhoneInfo(phoneNumber: string): Promise<PhoneNumberInfo> {
  const sender = getSmsSender();
  return sender.phoneInfo(phoneNumber);
}

/**
 * Check if phone number is a mobile number
 */
export async function isMobilePhone(phoneNumber: string): Promise<boolean> {
  const info = await getPhoneInfo(phoneNumber);
  return info.type === 'mobile';
}

/**
 * Check if phone number supports SMS
 */
export async function supportsSms(phoneNumber: string): Promise<boolean> {
  const info = await getPhoneInfo(phoneNumber);
  // Mobile and some VOIP numbers support SMS
  return info.type === 'mobile' || info.type === 'voip';
}

/**
 * Check if phone number supports voice calls
 */
export async function supportsVoice(phoneNumber: string): Promise<boolean> {
  const info = await getPhoneInfo(phoneNumber);
  // All phone types support voice
  return info.type !== 'unknown' || !info.error;
}
