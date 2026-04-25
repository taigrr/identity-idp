/**
 * Add Email Actions
 * Mirrors: app/controllers/users/emails_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session-manager';
import { addEmailToUser } from '@/lib/db/emails';

const SESSION_COOKIE_NAME = 'session_id';

interface AddEmailResult {
  success: boolean;
  email?: string;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function addEmail(params: { email: string }): Promise<AddEmailResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const { email } = params;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  try {
    const result = await addEmailToUser(session.userId, email);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // TODO: Send confirmation email
    console.log(`[DEV] Send confirmation email to ${email}`);

    return { success: true, email };
  } catch (error) {
    console.error('Failed to add email:', error);
    return { success: false, error: 'Failed to add email. Please try again.' };
  }
}
