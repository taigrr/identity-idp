/**
 * Account Reset Cancel Actions
 * Mirrors: app/controllers/account_reset/cancel_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import {
  validateCancelToken as validateToken,
  cancelAccountResetRequest,
} from '@/lib/db/account-reset';

const SESSION_COOKIE_NAME = 'session_id';

interface ValidateTokenResult {
  success: boolean;
  error?: string;
}

interface CancelResult {
  success: boolean;
  error?: string;
}

export async function validateCancelToken(
  token: string
): Promise<ValidateTokenResult> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // Validate the cancel token
  const result = await validateToken(token);

  if (!result.valid) {
    return { success: false, error: result.error || 'Invalid or expired cancel link' };
  }

  return { success: true };
}

export async function confirmCancelReset(token: string): Promise<CancelResult> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // Cancel the account reset request
  const result = await cancelAccountResetRequest(token);

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to cancel request' };
  }

  // Sign out user if they're signed in
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return { success: true };
}
