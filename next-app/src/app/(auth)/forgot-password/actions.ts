/**
 * Password Reset Actions
 * Mirrors: app/controllers/users/reset_passwords_controller.rb
 */

'use server';

import { randomBytes, createHash } from 'crypto';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  // TODO: Look up user by email
  // const user = await db.query.users.findFirst({
  //   where: eq(users.email, email.toLowerCase()),
  // });

  // Always return success to prevent email enumeration
  // Even if user doesn't exist, we don't reveal that

  // Generate reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenDigest = createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

  // TODO: Store reset token in database
  // if (user) {
  //   await db.update(users).set({
  //     resetPasswordToken: resetTokenDigest,
  //     resetPasswordSentAt: new Date(),
  //   }).where(eq(users.id, user.id));
  //
  //   // Send reset email
  //   await sendEmail({
  //     to: email,
  //     template: 'password_reset',
  //     data: {
  //       resetUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`,
  //     },
  //   });
  // }

  console.log(`[DEV] Password reset requested for ${email}, token: ${resetToken}`);

  return { success: true };
}

export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  userId?: string;
}> {
  if (!token) {
    return { valid: false, error: 'Missing reset token' };
  }

  const tokenDigest = createHash('sha256').update(token).digest('hex');

  // TODO: Look up user by reset token
  // const user = await db.query.users.findFirst({
  //   where: and(
  //     eq(users.resetPasswordToken, tokenDigest),
  //     gt(users.resetPasswordSentAt, new Date(Date.now() - 6 * 60 * 60 * 1000))
  //   ),
  // });
  //
  // if (!user) {
  //   return { valid: false, error: 'Invalid or expired reset token' };
  // }

  // For dev, accept any token
  console.log(`[DEV] Validating reset token: ${token}`);

  return { valid: true, userId: 'mock-user-id' };
}

export async function resetPassword(params: {
  token: string;
  password: string;
  passwordConfirmation: string;
}): Promise<PasswordResetResult> {
  const { token, password, passwordConfirmation } = params;

  // Validate passwords match
  if (password !== passwordConfirmation) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Validate password strength
  if (password.length < 12) {
    return { success: false, error: 'Password must be at least 12 characters' };
  }

  // Validate token
  const tokenResult = await validateResetToken(token);
  if (!tokenResult.valid) {
    return { success: false, error: tokenResult.error };
  }

  // TODO: Update password in database
  // const hashedPassword = await hashPassword(password);
  // await db.update(users).set({
  //   encryptedPassword: hashedPassword,
  //   resetPasswordToken: null,
  //   resetPasswordSentAt: null,
  // }).where(eq(users.id, tokenResult.userId));

  console.log(`[DEV] Password reset for user ${tokenResult.userId}`);

  // TODO: Send password change notification email

  return { success: true };
}
