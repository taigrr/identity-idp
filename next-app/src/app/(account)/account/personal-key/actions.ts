'use server';

/**
 * Personal Key Management Actions
 * Mirrors: app/controllers/users/personal_keys_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
  personalKey?: string;
  spSession?: {
    issuer?: string;
    requestUrl?: string;
  };
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserPersonalKeyGeneratedAt(userId: string): Promise<Date | null> {
  // TODO: Get from database
  return new Date();
}

async function userNeedsToReactivateAccount(userId: string): Promise<boolean> {
  // TODO: Check if user needs reactivation
  return false;
}

async function userHasNotVisitedAnySp(userId: string): Promise<boolean> {
  // TODO: Check if user has ever visited any SP
  return true;
}

/**
 * Get personal key page data
 */
export async function getPersonalKeyData(): Promise<{
  personalKey: string | null;
  generatedAt: Date | null;
  hasSp: boolean;
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

  const personalKey = session.personalKey || null;
  if (!personalKey) {
    redirect('/account');
  }

  const generatedAt = await getUserPersonalKeyGeneratedAt(session.userId);

  return {
    personalKey,
    generatedAt,
    hasSp: !!session.spSession?.issuer,
  };
}

/**
 * Acknowledge personal key and continue
 */
export async function acknowledgePersonalKey(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  // Clear personal key from session
  await updateSession(sessionId, { personalKey: undefined });

  // Determine next step
  const needsReactivation = await userNeedsToReactivateAccount(session.userId);
  if (needsReactivation) {
    redirect('/account/reactivate');
  }

  if (session.spSession?.issuer) {
    const notVisitedAnySp = await userHasNotVisitedAnySp(session.userId);
    if (notVisitedAnySp) {
      redirect('/signup/completed');
    }
  }

  redirect('/account');
}
