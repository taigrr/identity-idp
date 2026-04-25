'use server';

/**
 * Forget All Browsers Actions
 * Mirrors: app/controllers/users/forget_all_browsers_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function clearRememberDeviceForUser(userId: string): Promise<void> {
  // TODO: Delete all remember_device_revoked_at and device records
  console.log('Clearing remember device for user:', userId);
}

/**
 * Check auth state
 */
export async function checkAuthState(): Promise<{ authenticated: boolean }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  return { authenticated: true };
}

/**
 * Forget all browsers
 */
export async function forgetAllBrowsers(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  await clearRememberDeviceForUser(session.userId);

  redirect('/account');
}
