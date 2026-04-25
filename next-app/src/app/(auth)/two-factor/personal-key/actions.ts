'use server';

/**
 * Personal Key Verification Actions
 * Mirrors: app/controllers/two_factor_authentication/personal_key_verification_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
  personalKey?: string;
}

interface PersonalKeyVerificationResult {
  success: boolean;
  error?: string;
  needsNewKey?: boolean;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123' };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function checkPersonalKeyEnabled(userId: string): Promise<boolean> {
  // TODO: Check if user has personal key enabled
  return true;
}

async function verifyPersonalKey(userId: string, personalKey: string): Promise<boolean> {
  // TODO: Verify personal key against stored hash
  console.log('Verifying personal key for user:', userId);
  return personalKey.length === 16;
}

async function regeneratePersonalKey(userId: string): Promise<string> {
  // TODO: Generate and store new personal key
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key.toUpperCase();
}

async function sendPersonalKeyUsedAlert(userId: string): Promise<void> {
  // TODO: Send email alert about personal key usage
  console.log('Sending personal key used alert for user:', userId);
}

async function isUserIdentityVerified(userId: string): Promise<boolean> {
  // TODO: Check if user has verified identity
  return false;
}

async function hasMfaEnabled(userId: string): Promise<boolean> {
  // TODO: Check if user has other MFA methods enabled
  return true;
}

/**
 * Check if personal key is enabled
 */
export async function getPersonalKeyStatus(): Promise<{
  enabled: boolean;
  identityVerified: boolean;
  hasMfa: boolean;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  const [enabled, identityVerified, hasMfa] = await Promise.all([
    checkPersonalKeyEnabled(session.userId),
    isUserIdentityVerified(session.userId),
    hasMfaEnabled(session.userId),
  ]);

  if (!enabled) {
    redirect('/two-factor');
  }

  return { enabled, identityVerified, hasMfa };
}

/**
 * Verify personal key
 */
export async function verifyPersonalKeyAction(
  formData: FormData,
): Promise<PersonalKeyVerificationResult> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const personalKey = formData.get('personal_key')?.toString()?.replace(/[\s-]/g, '') || '';

  if (!personalKey) {
    return { success: false, error: 'Please enter your personal key' };
  }

  const isValid = await verifyPersonalKey(session.userId, personalKey);

  if (!isValid) {
    return { success: false, error: 'Incorrect personal key. Please try again.' };
  }

  // Personal key used - send alert and regenerate
  await sendPersonalKeyUsedAlert(session.userId);
  const newKey = await regeneratePersonalKey(session.userId);

  // Store new key in session for display
  await updateSession(sessionId, {
    mfaVerified: true,
    personalKey: newKey,
  });

  // Check where to redirect
  const [identityVerified, hasMfa] = await Promise.all([
    isUserIdentityVerified(session.userId),
    hasMfaEnabled(session.userId),
  ]);

  if (identityVerified) {
    // Must acknowledge new key before continuing
    redirect('/account/personal-key');
  } else if (hasMfa) {
    redirect('/account');
  } else {
    // Need to set up MFA
    redirect('/signup/mfa');
  }
}
