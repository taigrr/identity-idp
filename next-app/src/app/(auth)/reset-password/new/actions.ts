/**
 * Password Reset Actions
 * Mirrors: app/controllers/users/reset_passwords_controller.rb
 */

'use server';

import { findUserByResetToken, updatePassword } from '@/lib/db/users';
import { decrypt } from '@/lib/encryption';
import { getUserConfirmedEmailAddresses } from '@/lib/db/emails';

interface ValidateTokenResult {
  success: boolean;
  email?: string;
  error?: string;
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

const RESET_TOKEN_EXPIRY_HOURS = 6;

export async function validateResetToken(
  token: string
): Promise<ValidateTokenResult> {
  if (!token) {
    return { success: false, error: 'Missing reset token' };
  }

  try {
    const user = await findUserByResetToken(token);

    if (!user) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    // Check if token is expired
    if (user.resetPasswordSentAt) {
      const tokenAge = Date.now() - user.resetPasswordSentAt.getTime();
      const maxAge = RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

      if (tokenAge > maxAge) {
        return { success: false, error: 'This reset link has expired' };
      }
    }

    // Get user's email for display
    const emails = await getUserConfirmedEmailAddresses(user.id);
    let email = 'your email';

    if (emails.length > 0) {
      try {
        email = await decrypt(emails[0].encryptedEmail);
      } catch {
        // Use generic fallback
      }
    }

    return { success: true, email };
  } catch (error) {
    console.error('Failed to validate reset token:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

export async function resetPassword(params: {
  token: string;
  password: string;
  passwordConfirmation: string;
}): Promise<ResetPasswordResult> {
  const { token, password, passwordConfirmation } = params;

  if (!token) {
    return { success: false, error: 'Missing reset token' };
  }

  // Validate password
  if (!password || password.length < 12) {
    return { success: false, error: 'Password must be at least 12 characters' };
  }

  if (password !== passwordConfirmation) {
    return { success: false, error: 'Passwords do not match' };
  }

  try {
    // Validate token again
    const user = await findUserByResetToken(token);

    if (!user) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    // Check expiry
    if (user.resetPasswordSentAt) {
      const tokenAge = Date.now() - user.resetPasswordSentAt.getTime();
      const maxAge = RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

      if (tokenAge > maxAge) {
        return { success: false, error: 'This reset link has expired' };
      }
    }

    // Update password (this also clears the reset token)
    const updated = await updatePassword(user.id, password);

    if (!updated) {
      return { success: false, error: 'Failed to reset password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to reset password:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
