'use server';

/**
 * Account Reset Actions
 * Handles account reset flow when user can't access their MFA
 * Mirrors: app/controllers/account_reset/ controllers
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

// Account reset deletion period (24 hours by default)
const DELETION_PERIOD_HOURS = 24;

interface AccountResetState {
  error?: string;
  success?: boolean;
}

interface SessionData {
  userId?: string;
  userEmail?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function createAccountResetRequest(userId: string, spIssuer?: string): Promise<{ success: boolean; token?: string }> {
  console.log('Creating account reset request for user:', userId);
  // TODO: Replace with actual account reset request creation
  // AccountReset::CreateRequest.new(user, sp_issuer).call
  return { success: true, token: 'mock-token' };
}

async function isAccountResetRateLimited(userId: string): Promise<boolean> {
  console.log('Checking rate limit for user:', userId);
  return false;
}

async function deleteAccount(userId: string, token: string): Promise<{ success: boolean }> {
  console.log('Deleting account for user:', userId);
  // TODO: Replace with actual account deletion
  return { success: true };
}

async function cancelAccountResetRequest(userId: string): Promise<boolean> {
  console.log('Cancelling account reset for user:', userId);
  return true;
}

/**
 * Request account reset
 */
export async function requestAccountReset(
  _prevState: AccountResetState,
  formData: FormData,
): Promise<AccountResetState> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  // Check rate limits
  const isLimited = await isAccountResetRateLimited(session.userId);
  if (isLimited) {
    return { error: 'You have requested too many account resets. Please wait before trying again.' };
  }

  // Create the reset request
  const result = await createAccountResetRequest(session.userId);
  if (!result.success) {
    return { error: 'Failed to create account reset request. Please try again.' };
  }

  // Redirect to confirmation
  redirect('/account-reset/confirm');
}

/**
 * Confirm account deletion
 */
export async function confirmDeleteAccount(
  _prevState: AccountResetState,
  formData: FormData,
): Promise<AccountResetState> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  // Get confirmation token from form
  const token = formData.get('token')?.toString();
  if (!token) {
    return { error: 'Invalid or missing confirmation token' };
  }

  // Delete the account
  const result = await deleteAccount(session.userId, token);
  if (!result.success) {
    return { error: 'Failed to delete account. Please try again.' };
  }

  // Clear session and redirect
  const mutableCookies = await cookies();
  mutableCookies.delete(SESSION_COOKIE_NAME);

  redirect('/account-reset/complete');
}

/**
 * Cancel account reset request
 */
export async function cancelAccountReset(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  await cancelAccountResetRequest(session.userId);
  redirect('/account');
}
