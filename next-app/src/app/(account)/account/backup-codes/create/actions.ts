/**
 * Backup Codes Server Actions
 * Mirrors: app/services/backup_code_generator.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';
import { generateBackupCodes as generateCodes } from '@/lib/mfa/backup-codes';

export interface BackupCodesResult {
  success: boolean;
  codes?: string[];
  error?: string;
}

export interface BackupCodesConfirmResult {
  success: boolean;
  error?: string;
}

export async function generateBackupCodes(): Promise<BackupCodesResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Generate 10 backup codes
  const codes = generateCodes(10);

  // Store codes in session temporarily until user confirms they saved them
  await sessionManager.update(sessionId, {
    ...session,
    pendingBackupCodes: codes,
  });

  return {
    success: true,
    codes,
  };
}

export async function confirmBackupCodesSaved(): Promise<BackupCodesConfirmResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const sessionData = session as Record<string, unknown>;
  const codes = sessionData.pendingBackupCodes as string[] | undefined;

  if (!codes || codes.length === 0) {
    return { success: false, error: 'No backup codes to save' };
  }

  // TODO: Save backup codes to database (hashed)
  // First, delete existing backup codes
  // await db.delete(backupCodeConfigurations).where(
  //   eq(backupCodeConfigurations.userId, session.userId)
  // );

  // Then insert new ones with salted hashes
  // for (const code of codes) {
  //   const salt = randomBytes(16).toString('hex');
  //   const hash = hashBackupCode(code, salt);
  //   await db.insert(backupCodeConfigurations).values({
  //     userId: session.userId,
  //     codeSalt: salt,
  //     codeHash: hash,
  //     usedAt: null,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   });
  // }

  console.log(`[DEV] Backup codes saved for user ${session.userId}`);

  // Clear pending codes from session
  const { pendingBackupCodes: _, ...cleanSession } = sessionData;
  await sessionManager.update(sessionId, cleanSession);

  return { success: true };
}

export async function regenerateBackupCodes(): Promise<BackupCodesResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Generate new backup codes
  const codes = generateCodes(10);

  // Store codes in session temporarily
  await sessionManager.update(sessionId, {
    ...session,
    pendingBackupCodes: codes,
  });

  return {
    success: true,
    codes,
  };
}

export async function deleteBackupCodes(): Promise<BackupCodesConfirmResult> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // TODO: Delete backup codes from database
  // await db.delete(backupCodeConfigurations).where(
  //   eq(backupCodeConfigurations.userId, session.userId)
  // );

  console.log(`[DEV] Backup codes deleted for user ${session.userId}`);

  return { success: true };
}
