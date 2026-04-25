/**
 * Change Password Actions
 * Mirrors: app/controllers/users/passwords_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session-manager';
import { findUserById, updatePassword as updateUserPassword } from '@/lib/db/users';
import { verifyPassword, hashPassword } from '@/lib/auth/password-verifier';
import { decrypt } from '@/lib/encryption';

const SESSION_COOKIE_NAME = 'session_id';

export interface PasswordActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  };
  personalKeyRegenerated?: boolean;
  newPersonalKey?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function changePassword(
  _prevState: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const password = formData.get('password') as string;
  const passwordConfirmation = formData.get('passwordConfirmation') as string;

  // Validate inputs
  const fieldErrors: PasswordActionState['fieldErrors'] = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = 'Current password is required';
  }

  if (!password) {
    fieldErrors.password = 'New password is required';
  } else if (password.length < 12) {
    fieldErrors.password = 'Password must be at least 12 characters';
  }

  if (!passwordConfirmation) {
    fieldErrors.passwordConfirmation = 'Password confirmation is required';
  } else if (password !== passwordConfirmation) {
    fieldErrors.passwordConfirmation = 'Passwords do not match';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  try {
    // Get user
    const user = await findUserById(session.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    if (user.encryptedPasswordDigest) {
      const isValid = await verifyPassword(
        currentPassword,
        user.encryptedPasswordDigest,
        user.uuid
      );
      if (!isValid) {
        return {
          success: false,
          fieldErrors: { currentPassword: 'Current password is incorrect' },
        };
      }
    }

    // Update password
    const updated = await updateUserPassword(session.userId, password);
    if (!updated) {
      return { success: false, error: 'Failed to update password' };
    }

    // Check if user has a verified profile (would need personal key regeneration)
    // For now, just return success
    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
