'use server';

/**
 * Rules of Use Actions
 * Handles acceptance of terms and rules of use
 * Mirrors: app/controllers/users/rules_of_use_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface RulesOfUseState {
  error?: string;
}

interface SessionData {
  userId?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function acceptRulesOfUse(userId: string): Promise<boolean> {
  console.log('Accepting rules of use for user:', userId);
  // TODO: Replace with actual database update
  // user.update(accepted_terms_at: Time.zone.now)
  return true;
}

async function userNeedsToAcceptRules(userId: string): Promise<boolean> {
  console.log('Checking if user needs to accept rules:', userId);
  // TODO: Replace with actual check
  // !user.accepted_rules_of_use_still_valid?
  return true;
}

/**
 * Accept rules of use
 */
export async function submitRulesOfUse(
  _prevState: RulesOfUseState,
  formData: FormData,
): Promise<RulesOfUseState> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  // Validate checkbox was checked
  const termsAccepted = formData.get('terms_accepted') === 'true';
  if (!termsAccepted) {
    return { error: 'You must accept the rules of use to continue' };
  }

  // Record acceptance
  const success = await acceptRulesOfUse(session.userId);
  if (!success) {
    return { error: 'Failed to record acceptance. Please try again.' };
  }

  // Redirect to 2FA
  redirect('/two-factor');
}
