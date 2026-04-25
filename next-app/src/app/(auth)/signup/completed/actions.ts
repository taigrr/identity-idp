'use server';

/**
 * Sign Up Completion Actions
 * Mirrors: app/controllers/sign_up/completions_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  userUuid?: string;
  mfaVerified?: boolean;
  identityVerified?: boolean;
  inAccountCreationFlow?: boolean;
  selectedEmailIdForLinkedIdentity?: string;
  spSession?: {
    issuer?: string;
    requestUrl?: string;
    requestedAttributes?: string[];
    acrValues?: string;
  };
}

interface UserEmail {
  id: string;
  email: string;
  confirmed: boolean;
  isPrimary: boolean;
}

interface ServiceProvider {
  issuer: string;
  friendlyName: string;
  agencyName?: string;
  logoUrl?: string;
  requestedAttributes: string[];
  identityProofingRequired: boolean;
}

interface CompletionData {
  needsCompletionScreen: boolean;
  completionReason?: 'new_sp' | 'new_attributes' | 'reverified' | 'consent_expired';
  serviceProvider: ServiceProvider | null;
  userEmails: UserEmail[];
  selectedEmailId?: string;
  requestedAttributes: string[];
  identityVerified: boolean;
  multipleMfaEnabled: boolean;
  pii?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    address?: {
      address1?: string;
      city?: string;
      state?: string;
      zipcode?: string;
    };
  };
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return {
    userId: 'user-123',
    mfaVerified: true,
    inAccountCreationFlow: true,
    spSession: {
      issuer: 'urn:gov:gsa:openidconnect:sp:test',
      requestUrl: 'http://localhost:3001/auth/result',
      requestedAttributes: ['email', 'given_name', 'family_name'],
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
  ];
}

async function getServiceProvider(issuer: string): Promise<ServiceProvider | null> {
  // TODO: Replace with actual DB query
  return {
    issuer,
    friendlyName: 'Test Service Provider',
    requestedAttributes: ['email', 'given_name', 'family_name'],
    identityProofingRequired: false,
  };
}

async function checkNeedsCompletionScreen(
  userId: string,
  spIssuer: string,
): Promise<{ needed: boolean; reason?: string }> {
  // TODO: Check if user has previously consented to this SP
  return { needed: true, reason: 'new_sp' };
}

async function recordSpConsent(
  userId: string,
  spIssuer: string,
  selectedEmailId: string,
): Promise<void> {
  // TODO: Record consent in database and send notification email
  console.log('Recording SP consent:', { userId, spIssuer, selectedEmailId });
}

/**
 * Get completion page data
 */
export async function getCompletionData(): Promise<CompletionData> {
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
    // No SP session, redirect to account
    redirect('/account');
  }

  const [userEmails, serviceProvider, completionCheck] = await Promise.all([
    getUserEmails(session.userId),
    getServiceProvider(spSession.issuer),
    checkNeedsCompletionScreen(session.userId, spSession.issuer),
  ]);

  if (!completionCheck.needed) {
    // Already consented, redirect to SP
    if (spSession.requestUrl) {
      redirect(spSession.requestUrl);
    }
    redirect('/account');
  }

  return {
    needsCompletionScreen: true,
    completionReason: completionCheck.reason as CompletionData['completionReason'],
    serviceProvider,
    userEmails,
    selectedEmailId: session.selectedEmailIdForLinkedIdentity || userEmails[0]?.id,
    requestedAttributes: spSession.requestedAttributes || [],
    identityVerified: session.identityVerified || false,
    multipleMfaEnabled: true, // TODO: Check actual MFA configuration
  };
}

/**
 * Complete registration and redirect to SP
 */
export async function submitCompletion(
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

  const spSession = session.spSession;
  if (!spSession?.issuer) {
    redirect('/account');
  }

  const selectedEmailId = formData.get('selected_email_id')?.toString();
  if (!selectedEmailId) {
    return { error: 'Please select an email address' };
  }

  // Record consent
  await recordSpConsent(session.userId, spSession.issuer, selectedEmailId);

  // Update session with selected email
  await updateSession(sessionId, {
    selectedEmailIdForLinkedIdentity: selectedEmailId,
    inAccountCreationFlow: false,
  });

  // Redirect to SP
  if (spSession.requestUrl) {
    redirect(spSession.requestUrl);
  }

  redirect('/account');
}
