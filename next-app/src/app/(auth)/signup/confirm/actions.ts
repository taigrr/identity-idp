/**
 * Email Confirmation Actions
 * Mirrors: app/controllers/sign_up/email_confirmations_controller.rb
 */

'use server';

import { createHash } from 'crypto';

export interface EmailConfirmResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export async function confirmEmail(token: string): Promise<EmailConfirmResult> {
  if (!token) {
    return { success: false, error: 'Missing confirmation token' };
  }

  const tokenDigest = createHash('sha256').update(token).digest('hex');

  // TODO: Look up email address by confirmation token
  // const emailAddress = await db.query.emailAddresses.findFirst({
  //   where: and(
  //     eq(emailAddresses.confirmationToken, tokenDigest),
  //     isNull(emailAddresses.confirmedAt),
  //     gt(emailAddresses.confirmationSentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
  //   ),
  // });
  //
  // if (!emailAddress) {
  //   return { success: false, error: 'Invalid or expired confirmation token' };
  // }

  // TODO: Mark email as confirmed
  // await db.update(emailAddresses).set({
  //   confirmedAt: new Date(),
  //   confirmationToken: null,
  // }).where(eq(emailAddresses.id, emailAddress.id));

  console.log(`[DEV] Email confirmed with token: ${token}`);

  return { success: true, userId: 'mock-user-id' };
}

export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  // TODO: Generate new confirmation token and send email
  // const emailAddress = await db.query.emailAddresses.findFirst({
  //   where: and(
  //     eq(emailAddresses.email, email.toLowerCase()),
  //     isNull(emailAddresses.confirmedAt)
  //   ),
  // });
  //
  // if (emailAddress) {
  //   const newToken = randomBytes(32).toString('hex');
  //   await db.update(emailAddresses).set({
  //     confirmationToken: createHash('sha256').update(newToken).digest('hex'),
  //     confirmationSentAt: new Date(),
  //   }).where(eq(emailAddresses.id, emailAddress.id));
  //
  //   await sendEmail({
  //     to: email,
  //     template: 'email_confirmation',
  //     data: { confirmUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/signup/confirm?confirmation_token=${newToken}` },
  //   });
  // }

  // Always return success to prevent email enumeration
  console.log(`[DEV] Resent confirmation email to: ${email}`);

  return { success: true };
}
