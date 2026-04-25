/**
 * SMS Opt-In Actions
 * Mirrors: app/controllers/users/sms_opt_in_controller.rb
 */

'use server';

import { optInPhone } from '@/lib/db/phones';

interface OptInResult {
  success: boolean;
  error?: string;
  alreadyOptedIn?: boolean;
}

interface OptInData {
  phoneInfo?: {
    formattedPhone: string;
  };
  found: boolean;
  cancelUrl?: string;
  hasOtherMethods?: boolean;
}

export async function getSmsOptInData(uuid: string): Promise<OptInData> {
  // TODO: Look up the opt-out record to get phone number
  return {
    found: true,
    phoneInfo: { formattedPhone: '***-***-1234' },
    cancelUrl: '/two-factor',
    hasOtherMethods: true,
  };
}

export async function optInToSms(uuid: string): Promise<OptInResult> {
  const result = await confirmSmsOptIn(uuid);
  return { ...result, alreadyOptedIn: false };
}

export async function confirmSmsOptIn(uuid: string): Promise<OptInResult> {
  if (!uuid) {
    return { success: false, error: 'Missing opt-out identifier' };
  }

  try {
    const result = await optInPhone(uuid);

    if (!result) {
      return {
        success: false,
        error: 'Could not find opt-out record. You may have already opted back in.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to process SMS opt-in:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
