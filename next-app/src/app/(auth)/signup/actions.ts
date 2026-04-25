'use server';

/**
 * Sign Up Actions
 * Handles user registration flow
 * Mirrors: app/controllers/sign_up/ controllers
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface RegisterState {
  error?: string;
  fieldErrors?: {
    email?: string;
    terms?: string;
  };
}

interface CompletionState {
  error?: string;
}

interface SessionData {
  userId?: string;
  email?: string;
  termsAccepted?: boolean;
  signInFlow?: string;
  spSession?: {
    requestUrl?: string;
    issuer?: string;
  };
  selectedEmailIdForLinkedIdentity?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function createUser(email: string, emailLanguage: string): Promise<{ success: boolean; userId?: string; emailTaken?: boolean }> {
  console.log('Creating user with email:', email);
  // TODO: Replace with actual user creation
  return { success: true, userId: 'new-user-id' };
}

async function sendConfirmationEmail(email: string): Promise<boolean> {
  console.log('Sending confirmation email to:', email);
  return true;
}

async function isEmailTaken(email: string): Promise<boolean> {
  console.log('Checking if email is taken:', email);
  return false;
}

/**
 * Register new user email
 */
export async function registerEmail(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const emailLanguage = formData.get('email_language')?.toString() || 'en';
  const termsAccepted = formData.get('terms_accepted') === 'true';

  // Validate email
  if (!email) {
    return { fieldErrors: { email: 'Email is required' } };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { fieldErrors: { email: 'Please enter a valid email address' } };
  }

  // Validate terms acceptance
  if (!termsAccepted) {
    return { fieldErrors: { terms: 'You must accept the terms of use' } };
  }

  // Create user or check if email exists
  const result = await createUser(email, emailLanguage);

  if (!result.success) {
    return { error: 'Failed to create account. Please try again.' };
  }

  // Send confirmation email (even if email is taken for security)
  await sendConfirmationEmail(email);

  // Store email in session
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await updateSession(sessionId, {
      email,
      termsAccepted,
      signInFlow: 'create_account',
    });
  }

  // Redirect to verify email page
  redirect('/signup/verify-email');
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.email) {
    return { success: false, error: 'No email found in session' };
  }

  const sent = await sendConfirmationEmail(session.email);
  return { success: sent };
}

/**
 * Complete registration and redirect to SP
 */
export async function completeRegistration(
  _prevState: CompletionState,
  formData: FormData,
): Promise<CompletionState> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  // Record selected email for SP
  const selectedEmailId = formData.get('selected_email_id')?.toString();
  if (selectedEmailId) {
    await updateSession(sessionId, {
      selectedEmailIdForLinkedIdentity: selectedEmailId,
    });
  }

  // Redirect to SP or account
  if (session.spSession?.requestUrl) {
    redirect(session.spSession.requestUrl);
  }

  redirect('/account');
}

/**
 * Cancel registration
 */
export async function cancelRegistration(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    // Clear session data
    await updateSession(sessionId, {
      email: undefined,
      termsAccepted: undefined,
      signInFlow: undefined,
    });
  }

  redirect('/');
}
