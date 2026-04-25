/**
 * Email Management Actions
 * Mirrors: app/controllers/users/emails_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import {
  getUserEmailAddresses,
  createEmailAddress,
  deleteEmailAddress as removeEmail,
  confirmEmail as confirmEmailToken,
  isEmailConfirmedByAnotherUser,
  isOnlyConfirmedEmail,
  resendConfirmation,
  findEmailByFingerprint,
  fingerprintEmail,
} from '@/lib/db/emails';
import { getSession } from '@/lib/auth/session-manager';
import { decrypt } from '@/lib/encryption';
import { config } from '@/lib/config';

const SESSION_COOKIE_NAME = 'session_id';

interface EmailAddress {
  id: string;
  email: string;
  confirmed: boolean;
  confirmedAt: string | null;
  isPrimary: boolean;
}

interface GetEmailsResult {
  success: boolean;
  data?: {
    emails: EmailAddress[];
    canAddEmail: boolean;
    maxEmails: number;
  };
  error?: string;
}

interface AddEmailResult {
  success: boolean;
  email?: string;
  error?: string;
}

interface DeleteEmailResult {
  success: boolean;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getUserEmails(): Promise<GetEmailsResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const maxEmails = config.maxEmailsPerUser ?? 12;

  // Get user's email addresses from database
  const dbEmails = await getUserEmailAddresses(session.userId);

  // Transform to API format
  const emails: EmailAddress[] = await Promise.all(
    dbEmails.map(async (e, index) => {
      // Decrypt email for display
      let email = 'unknown@example.gov';
      try {
        email = await decrypt(e.encryptedEmail);
      } catch {
        // Use masked version if decryption fails
      }

      return {
        id: e.id.toString(),
        email,
        confirmed: e.confirmedAt !== null,
        confirmedAt: e.confirmedAt?.toISOString() || null,
        isPrimary: index === 0, // First email is primary
      };
    })
  );

  return {
    success: true,
    data: {
      emails,
      canAddEmail: emails.length < maxEmails,
      maxEmails,
    },
  };
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check max emails limit
  const maxEmails = config.maxEmailsPerUser ?? 12;
  const existingEmails = await getUserEmailAddresses(session.userId);
  if (existingEmails.length >= maxEmails) {
    return {
      success: false,
      error: `You can only have up to ${maxEmails} email addresses`,
    };
  }

  // Check if email already exists for this user
  const existingForUser = await findEmailByFingerprint(
    session.userId,
    normalizedEmail
  );
  if (existingForUser) {
    return {
      success: false,
      error: 'You have already added this email address',
    };
  }

  // Check if email is confirmed by another user
  const usedByAnother = await isEmailConfirmedByAnotherUser(
    normalizedEmail,
    session.userId
  );
  if (usedByAnother) {
    // In production, send a special email instead of returning error
    // to prevent email enumeration
    return {
      success: true,
      email: normalizedEmail,
    };
  }

  // Create the email address record
  await createEmailAddress(session.userId, normalizedEmail);

  // TODO: Send confirmation email

  return {
    success: true,
    email: normalizedEmail,
  };
}

export async function resendEmailConfirmation(
  emailId: string
): Promise<AddEmailResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const result = await resendConfirmation(session.userId, parseInt(emailId, 10));

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // TODO: Send actual confirmation email with result.token

  return { success: true, email: emailId };
}

export async function deleteEmail(emailId: string): Promise<DeleteEmailResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const id = parseInt(emailId, 10);

  // Check it's not the last confirmed email
  const isOnly = await isOnlyConfirmedEmail(session.userId, id);
  if (isOnly) {
    return {
      success: false,
      error: 'You cannot delete your only email address',
    };
  }

  // Delete the email
  const deleted = await removeEmail(session.userId, id);

  if (!deleted) {
    return { success: false, error: 'Failed to delete email address' };
  }

  // TODO: Send notification emails to remaining addresses

  return { success: true };
}

export async function confirmEmail(token: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  if (!token) {
    return { success: false, error: 'Missing confirmation token' };
  }

  const result = await confirmEmailToken(token);

  if (!result.success || !result.emailAddress) {
    return { success: false, error: result.error || 'Invalid or expired token' };
  }

  // Decrypt email for display
  let email = 'your email';
  try {
    email = await decrypt(result.emailAddress.encryptedEmail);
  } catch {
    // Use generic message
  }

  return {
    success: true,
    email,
  };
}
