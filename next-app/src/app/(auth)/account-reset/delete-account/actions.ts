/**
 * Account Reset Delete Account Actions
 * Mirrors: app/controllers/account_reset/delete_account_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import {
  validateGrantedToken as validateToken,
  deleteUserAccount,
} from '@/lib/db/account-reset';
import { decrypt } from '@/lib/encryption';

const SESSION_COOKIE_NAME = 'session_id';

interface ValidateGrantedTokenResult {
  success: boolean;
  email?: string;
  error?: string;
}

interface DeleteAccountResult {
  success: boolean;
  email?: string;
  accountAgeInDays?: number;
  error?: string;
}

export async function validateGrantedToken(
  token: string
): Promise<ValidateGrantedTokenResult> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // Validate the granted token
  const result = await validateToken(token);

  if (!result.valid || !result.user) {
    return {
      success: false,
      error: result.error || 'This link is invalid or has expired',
    };
  }

  // Get user's primary email for display
  // Note: In production, we'd decrypt the email
  let email = 'your email';
  if (result.user.encryptedPasswordDigest) {
    // Would actually fetch and decrypt email from emailAddresses table
    email = 'user@example.gov';
  }

  return {
    success: true,
    email,
  };
}

export async function deleteAccount(token: string): Promise<DeleteAccountResult> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // Validate token first
  const validation = await validateToken(token);

  if (!validation.valid || !validation.user) {
    return {
      success: false,
      error: validation.error || 'This link is invalid or has expired',
    };
  }

  // Get user's email before deletion
  let email = 'user@example.gov'; // Would decrypt from database

  // Delete the user account
  const result = await deleteUserAccount(token);

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to delete account',
    };
  }

  // Sign out user
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return {
    success: true,
    email,
    accountAgeInDays: result.accountAgeInDays,
  };
}

export async function cancelDeleteFromGrant(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // Note: Cancelling from granted state is different from pending
  // The user has already passed the waiting period
  // This would invalidate the granted token

  // For now, we just validate the token exists
  const validation = await validateToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // In production, this would mark the request as cancelled
  // even after being granted

  return { success: true };
}
