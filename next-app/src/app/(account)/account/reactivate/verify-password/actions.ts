'use server';

/**
 * Verify Password Actions
 * Mirrors: app/controllers/users/verify_password_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
  needsReactivation?: boolean;
  reactivationToken?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true, needsReactivation: true };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  // TODO: Verify password
  console.log('Verifying password for user:', userId);
  return password.length >= 12;
}

async function reactivateUserProfile(userId: string): Promise<string> {
  // TODO: Reactivate user profile and return personal key
  return 'ABCD-1234-EFGH-5678';
}

/**
 * Check if user needs reactivation
 */
export async function checkReactivationStatus(): Promise<{
  needsReactivation: boolean;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  if (!session.needsReactivation) {
    redirect('/account');
  }

  return { needsReactivation: true };
}

/**
 * Verify password for reactivation
 */
export async function verifyPasswordForReactivation(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const password = formData.get('password')?.toString();
  if (!password) {
    return { success: false, error: 'Please enter your password' };
  }

  const isValid = await verifyUserPassword(session.userId, password);
  if (!isValid) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Reactivate and get personal key
  const personalKey = await reactivateUserProfile(session.userId);

  await updateSession(sessionId, {
    needsReactivation: false,
    reactivationToken: personalKey,
  });

  redirect('/account/personal-key');
}
