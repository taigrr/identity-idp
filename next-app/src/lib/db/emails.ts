/**
 * Email Address Service
 * Mirrors: app/services/send_add_email_confirmation.rb
 *          app/services/email_confirmation_token_validator.rb
 *
 * Handles email address management for users.
 */

import { eq, and, ne, sql } from 'drizzle-orm';
import { db, emailAddresses, type EmailAddress, type NewEmailAddress } from '@/db';
import { createHash, randomBytes } from 'crypto';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Generates a fingerprint for an email address (for lookups without decryption).
 */
export function fingerprintEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generates a random confirmation token.
 */
export function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new email address for a user.
 */
export async function createEmailAddress(
  userId: number,
  email: string
): Promise<EmailAddress> {
  const now = new Date();
  const fingerprint = fingerprintEmail(email);
  const encryptedEmail = await encrypt(email);
  const confirmationToken = generateConfirmationToken();

  const [created] = await db
    .insert(emailAddresses)
    .values({
      userId,
      encryptedEmail,
      emailFingerprint: fingerprint,
      confirmationToken,
      confirmationSentAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

/**
 * Finds an email address by confirmation token.
 */
export async function findByConfirmationToken(
  token: string
): Promise<EmailAddress | null> {
  const email = await db.query.emailAddresses.findFirst({
    where: eq(emailAddresses.confirmationToken, token),
  });
  return email ?? null;
}

/**
 * Confirms an email address.
 */
export async function confirmEmail(
  token: string
): Promise<{ success: boolean; emailAddress?: EmailAddress; error?: string }> {
  const email = await findByConfirmationToken(token);

  if (!email) {
    return { success: false, error: 'Invalid confirmation token' };
  }

  if (email.confirmedAt) {
    return { success: false, error: 'Email already confirmed' };
  }

  const now = new Date();

  const [updated] = await db
    .update(emailAddresses)
    .set({
      confirmedAt: now,
      confirmationToken: null,
      updatedAt: now,
    })
    .where(eq(emailAddresses.id, email.id))
    .returning();

  return { success: true, emailAddress: updated };
}

/**
 * Checks if email is already confirmed by another user.
 * Mirrors: SendAddEmailConfirmation#already_confirmed_by_another_user?
 */
export async function isEmailConfirmedByAnotherUser(
  email: string,
  userId: number
): Promise<boolean> {
  const fingerprint = fingerprintEmail(email);

  const existing = await db.query.emailAddresses.findFirst({
    where: and(
      eq(emailAddresses.emailFingerprint, fingerprint),
      sql`${emailAddresses.confirmedAt} IS NOT NULL`,
      ne(emailAddresses.userId, userId)
    ),
  });

  return existing !== undefined;
}

/**
 * Gets all email addresses for a user.
 */
export async function getUserEmailAddresses(
  userId: number
): Promise<EmailAddress[]> {
  return db.query.emailAddresses.findMany({
    where: eq(emailAddresses.userId, userId),
  });
}

/**
 * Gets all confirmed email addresses for a user.
 */
export async function getUserConfirmedEmailAddresses(
  userId: number
): Promise<EmailAddress[]> {
  return db.query.emailAddresses.findMany({
    where: and(
      eq(emailAddresses.userId, userId),
      sql`${emailAddresses.confirmedAt} IS NOT NULL`
    ),
  });
}

/**
 * Finds an email address by fingerprint and user.
 */
export async function findEmailByFingerprint(
  userId: number,
  email: string
): Promise<EmailAddress | null> {
  const fingerprint = fingerprintEmail(email);

  const result = await db.query.emailAddresses.findFirst({
    where: and(
      eq(emailAddresses.userId, userId),
      eq(emailAddresses.emailFingerprint, fingerprint)
    ),
  });

  return result ?? null;
}

/**
 * Deletes an email address.
 */
export async function deleteEmailAddress(
  userId: number,
  emailId: number
): Promise<boolean> {
  const result = await db
    .delete(emailAddresses)
    .where(
      and(eq(emailAddresses.id, emailId), eq(emailAddresses.userId, userId))
    )
    .returning();

  return result.length > 0;
}

/**
 * Updates last sign-in timestamp for an email.
 */
export async function updateLastSignIn(emailId: number): Promise<void> {
  const now = new Date();
  await db
    .update(emailAddresses)
    .set({
      lastSignInAt: now,
      updatedAt: now,
    })
    .where(eq(emailAddresses.id, emailId));
}

/**
 * Resends confirmation email for an unconfirmed address.
 */
export async function resendConfirmation(
  userId: number,
  emailId: number
): Promise<{ success: boolean; token?: string; error?: string }> {
  const email = await db.query.emailAddresses.findFirst({
    where: and(
      eq(emailAddresses.id, emailId),
      eq(emailAddresses.userId, userId)
    ),
  });

  if (!email) {
    return { success: false, error: 'Email not found' };
  }

  if (email.confirmedAt) {
    return { success: false, error: 'Email already confirmed' };
  }

  const now = new Date();
  const newToken = generateConfirmationToken();

  await db
    .update(emailAddresses)
    .set({
      confirmationToken: newToken,
      confirmationSentAt: now,
      updatedAt: now,
    })
    .where(eq(emailAddresses.id, emailId));

  return { success: true, token: newToken };
}

/**
 * Counts confirmed email addresses for a user.
 */
export async function countConfirmedEmails(userId: number): Promise<number> {
  const emails = await getUserConfirmedEmailAddresses(userId);
  return emails.length;
}

/**
 * Checks if this is the user's only confirmed email.
 */
export async function isOnlyConfirmedEmail(
  userId: number,
  emailId: number
): Promise<boolean> {
  const confirmedEmails = await getUserConfirmedEmailAddresses(userId);
  return confirmedEmails.length === 1 && confirmedEmails[0].id === emailId;
}

/**
 * Adds a new email to a user's account and sends confirmation.
 * Returns error if email already exists.
 */
export async function addEmailToUser(
  userId: number,
  email: string
): Promise<{ success: boolean; emailId?: number; error?: string }> {
  // Check if email already confirmed by another user
  if (await isEmailConfirmedByAnotherUser(email, userId)) {
    return { success: false, error: 'This email is already in use' };
  }

  // Check if user already has this email
  const existing = await findEmailByFingerprint(userId, email);
  if (existing) {
    if (existing.confirmedAt) {
      return { success: false, error: 'You already have this email address' };
    }
    // Resend confirmation for unconfirmed email
    await resendConfirmation(userId, existing.id);
    return { success: true, emailId: existing.id };
  }

  // Create new email address
  const newEmail = await createEmailAddress(userId, email);
  return { success: true, emailId: newEmail.id };
}
