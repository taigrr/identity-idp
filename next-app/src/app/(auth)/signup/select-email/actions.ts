'use server';

/**
 * Select Email Actions
 * Mirrors: app/controllers/sign_up/select_email_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';
const MAX_EMAILS_PER_USER = 12;

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
  selectedEmailIdForLinkedIdentity?: string;
  spSession?: {
    issuer?: string;
    requestUrl?: string;
  };
}

interface UserEmail {
  id: string;
  email: string;
  confirmed: boolean;
  isPrimary: boolean;
}

interface SelectEmailData {
  needsCompletionScreen: boolean;
  spName: string;
  userEmails: UserEmail[];
  selectedEmailId?: string;
  canAddEmail: boolean;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return {
    userId: 'user-123',
    mfaVerified: true,
    spSession: {
      issuer: 'urn:gov:gsa:openidconnect:sp:test',
      requestUrl: 'http://localhost:3001/auth/result',
    },
  };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserEmails(userId: string): Promise<UserEmail[]> {
  // TODO: Replace with actual DB query
  return [
    { id: 'email-1', email: 'user@example.com', confirmed: true, isPrimary: true },
    { id: 'email-2', email: 'user.alt@example.com', confirmed: true, isPrimary: false },
  ];
}

async function getSpFriendlyName(issuer: string): Promise<string> {
  // TODO: Replace with actual DB query
  return 'Test Service Provider';
}

async function checkNeedsCompletionScreen(
  userId: string,
  spIssuer: string,
): Promise<boolean> {
  // TODO: Check if user needs completion screen
  return true;
}

async function validateEmailBelongsToUser(
  userId: string,
  emailId: string,
): Promise<boolean> {
  // TODO: Verify email belongs to user
  return true;
}

/**
 * Get data for select email page
 */
export async function getSelectEmailData(): Promise<SelectEmailData> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  const spSession = session.spSession;
  if (!spSession?.issuer) {
    redirect('/account');
  }

  const needsCompletion = await checkNeedsCompletionScreen(session.userId, spSession.issuer);
  if (!needsCompletion) {
    redirect('/account');
  }

  const [userEmails, spName] = await Promise.all([
    getUserEmails(session.userId),
    getSpFriendlyName(spSession.issuer),
  ]);

  return {
    needsCompletionScreen: true,
    spName,
    userEmails,
    selectedEmailId: session.selectedEmailIdForLinkedIdentity || userEmails.find(e => e.isPrimary)?.id,
    canAddEmail: userEmails.length < MAX_EMAILS_PER_USER,
  };
}

/**
 * Select email to share with SP
 */
export async function selectEmail(
  formData: FormData,
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  const selectedEmailId = formData.get('selected_email_id')?.toString();
  if (!selectedEmailId) {
    return { error: 'Please select an email address' };
  }

  // Validate email belongs to user
  const isValid = await validateEmailBelongsToUser(session.userId, selectedEmailId);
  if (!isValid) {
    return { error: 'Invalid email selection' };
  }

  // Update session with selected email
  await updateSession(sessionId, {
    selectedEmailIdForLinkedIdentity: selectedEmailId,
  });

  // Redirect back to completion page
  redirect('/signup/completed');
}
