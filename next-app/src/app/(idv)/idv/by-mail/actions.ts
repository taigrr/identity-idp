'use server';

/**
 * GPO Mail Verification Actions
 * Handles GPO letter request and verification code submission
 * Mirrors: app/controllers/idv/by_mail/ controllers
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Session cookie name
const SESSION_COOKIE_NAME = 'session_id';

// GPO verification code format: 10 alphanumeric characters
const GPO_CODE_LENGTH = 10;
const GPO_CODE_PATTERN = /^[A-Z0-9]{10}$/i;

// Rate limiting
const MAX_GPO_CODE_ATTEMPTS = 5;
const MAX_LETTER_REQUESTS = 3;

interface GpoVerifyState {
  error?: string;
  success?: boolean;
  rateLimited?: boolean;
  canRequestAnotherLetter?: boolean;
}

interface RequestLetterState {
  error?: string;
  success?: boolean;
  rateLimited?: boolean;
}

interface SessionData {
  userId?: string;
  idv?: {
    addressVerificationMechanism?: 'phone' | 'gpo';
    gpoCodeAttempts?: number;
    letterRequestCount?: number;
    gpoRequestLetterVisited?: boolean;
  };
}

interface GpoConfirmationCode {
  id: string;
  code: string;
  profileId: string;
  createdAt: Date;
  usedAt?: Date;
}

// TODO: Replace with actual database/session operations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserPendingProfile(userId: string): Promise<{ id: string; gpoConfirmationCodes: GpoConfirmationCode[] } | null> {
  console.log('Getting pending profile for user:', userId);
  // TODO: Replace with actual database lookup
  // user.gpo_verification_pending_profile
  return null;
}

async function verifyGpoCode(userId: string, code: string): Promise<{ success: boolean; error?: string; fraudCheckFailed?: boolean }> {
  console.log('Verifying GPO code for user:', userId);
  // TODO: Replace with actual verification
  // GpoVerifyForm.new(...).submit
  return { success: false, error: 'Invalid verification code' };
}

async function enqueueGpoLetter(userId: string, address: unknown): Promise<{ success: boolean; letterEnqueuedAt?: Date }> {
  console.log('Enqueueing GPO letter for user:', userId);
  // TODO: Replace with actual letter enqueue
  // GpoMail.new(current_user).enqueue_letter
  return { success: true, letterEnqueuedAt: new Date() };
}

async function getGpoRateLimitStatus(userId: string): Promise<{ codeLimited: boolean; letterLimited: boolean }> {
  console.log('Checking GPO rate limits for user:', userId);
  // TODO: Replace with actual rate limit check
  return { codeLimited: false, letterLimited: false };
}

async function incrementGpoCodeAttempt(userId: string): Promise<number> {
  console.log('Incrementing GPO code attempt for user:', userId);
  // TODO: Replace with actual rate limiter increment
  return 1;
}

async function markAddressVerified(userId: string, profileId: string): Promise<void> {
  console.log('Marking address verified for profile:', profileId);
  // TODO: Replace with actual profile activation
}

async function createUserEvent(userId: string, eventType: string): Promise<void> {
  console.log('Creating user event:', eventType, 'for user:', userId);
}

/**
 * Request a GPO verification letter
 */
export async function requestLetter(
  _prevState: RequestLetterState,
  formData: FormData,
): Promise<RequestLetterState> {
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
  const rateLimits = await getGpoRateLimitStatus(session.userId);
  if (rateLimits.letterLimited) {
    return { error: 'You have requested too many letters. Please wait before requesting another.', rateLimited: true };
  }

  // Get pending profile with address
  const pendingProfile = await getUserPendingProfile(session.userId);
  if (!pendingProfile) {
    redirect('/idv');
  }

  // Enqueue the letter
  const result = await enqueueGpoLetter(session.userId, null);

  if (!result.success) {
    return { error: 'Failed to request verification letter. Please try again.' };
  }

  // Update session to mark GPO as the verification method
  await updateSession(sessionId, {
    idv: {
      ...session.idv,
      addressVerificationMechanism: 'gpo',
      letterRequestCount: (session.idv?.letterRequestCount || 0) + 1,
    },
  });

  // Create event
  await createUserEvent(session.userId, 'gpo_mail_sent');

  // Redirect to letter enqueued confirmation
  redirect('/idv/by-mail/letter-enqueued');
}

/**
 * Verify the GPO code from the letter
 */
export async function verifyCode(
  _prevState: GpoVerifyState,
  formData: FormData,
): Promise<GpoVerifyState> {
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
  const rateLimits = await getGpoRateLimitStatus(session.userId);
  if (rateLimits.codeLimited) {
    redirect('/idv/by-mail/enter-code/rate-limited');
  }

  // Get and validate the code
  const code = formData.get('code')?.toString().trim().toUpperCase();

  if (!code) {
    return { error: 'Please enter your verification code' };
  }

  if (code.length !== GPO_CODE_LENGTH) {
    return { error: `Verification code must be ${GPO_CODE_LENGTH} characters` };
  }

  if (!GPO_CODE_PATTERN.test(code)) {
    return { error: 'Verification code can only contain letters and numbers' };
  }

  // Increment attempt counter
  await incrementGpoCodeAttempt(session.userId);

  // Get pending profile
  const pendingProfile = await getUserPendingProfile(session.userId);
  if (!pendingProfile) {
    return { error: 'No pending verification found. Please start over.' };
  }

  // Verify the code
  const result = await verifyGpoCode(session.userId, code);

  if (!result.success) {
    // Check if now rate limited
    const newRateLimits = await getGpoRateLimitStatus(session.userId);
    if (newRateLimits.codeLimited) {
      redirect('/idv/by-mail/enter-code/rate-limited');
    }

    return {
      error: result.error || 'Invalid verification code. Please try again.',
      canRequestAnotherLetter: !newRateLimits.letterLimited,
    };
  }

  // Handle fraud check failure
  if (result.fraudCheckFailed) {
    redirect('/please-call');
  }

  // Mark address as verified
  await markAddressVerified(session.userId, pendingProfile.id);

  // Create verified event
  await createUserEvent(session.userId, 'account_verified');

  // Update session
  await updateSession(sessionId, {
    idv: {
      ...session.idv,
      addressVerificationMechanism: 'gpo',
    },
  });

  // Redirect to personal key
  redirect('/idv/personal-key');
}

/**
 * Request another GPO letter (resend)
 */
export async function resendLetter(
  _prevState: RequestLetterState,
  formData: FormData,
): Promise<RequestLetterState> {
  // Same logic as requestLetter but with different tracking
  return requestLetter(_prevState, formData);
}
