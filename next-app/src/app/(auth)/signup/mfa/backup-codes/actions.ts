/**
 * Backup Code Setup Actions - Signup Flow
 * Mirrors: app/controllers/users/backup_code_setup_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import {
  deleteAndRegenerateBackupCodes,
  countUnusedBackupCodes,
} from '@/lib/db/backup-codes';
import { getSession, updateSession } from '@/lib/auth/session-manager';

const SESSION_COOKIE_NAME = 'session_id';

interface BackupCodesResult {
  success: boolean;
  codes?: string[];
  error?: string;
}

interface ConfirmResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function generateBackupCodes(): Promise<BackupCodesResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    // Generate and store backup codes in database
    const codes = await deleteAndRegenerateBackupCodes(session.userId);

    // Store codes in session for display (will be cleared after confirmation)
    await updateSession(sessionId, {
      backupCodes: codes,
    });

    return {
      success: true,
      codes,
    };
  } catch (error) {
    console.error('Failed to generate backup codes:', error);
    return {
      success: false,
      error: 'Failed to generate backup codes. Please try again.',
    };
  }
}

export async function confirmBackupCodesSaved(): Promise<ConfirmResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  // Verify codes are in session (user has seen them)
  if (!session.backupCodes || session.backupCodes.length === 0) {
    return {
      success: false,
      error: 'Backup codes not found. Please generate new codes.',
    };
  }

  // Clear codes from session
  await updateSession(sessionId, {
    backupCodes: undefined,
  });

  // Update completed MFA methods
  const completedMfa = session.completedMfa || [];
  completedMfa.push('backup_codes');

  await updateSession(sessionId, {
    completedMfa,
  });

  // Check if more MFA methods need to be set up
  const mfaSelections = session.mfaSelections || [];
  const remainingMfa = mfaSelections.filter(
    (m: string) => !completedMfa.includes(m)
  );
  const hasMoreMfaToSetup = remainingMfa.length > 0;

  return {
    success: true,
    redirectTo: hasMoreMfaToSetup ? '/signup/mfa' : '/signup/completed',
  };
}

export async function regenerateBackupCodes(): Promise<BackupCodesResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    // Delete existing codes and generate new ones
    const codes = await deleteAndRegenerateBackupCodes(session.userId);

    // Store codes in session for display
    await updateSession(sessionId, {
      backupCodes: codes,
    });

    return {
      success: true,
      codes,
    };
  } catch (error) {
    console.error('Failed to regenerate backup codes:', error);
    return {
      success: false,
      error: 'Failed to regenerate backup codes. Please try again.',
    };
  }
}

export async function getBackupCodeCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    const count = await countUnusedBackupCodes(session.userId);
    return { success: true, count };
  } catch (error) {
    console.error('Failed to get backup code count:', error);
    return { success: false, error: 'Failed to retrieve backup code count' };
  }
}
