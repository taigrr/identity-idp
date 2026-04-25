'use server';

/**
 * Two-Factor Authentication Settings Actions
 * Mirrors: app/controllers/accounts/two_factor_authentication_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
}

interface MfaConfiguration {
  id: string;
  type: 'phone' | 'totp' | 'webauthn' | 'webauthn_platform' | 'piv_cac' | 'backup_codes' | 'personal_key';
  name?: string;
  phone?: string;
  createdAt: string;
  lastUsedAt?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function getUserMfaConfigurations(userId: string): Promise<MfaConfiguration[]> {
  // TODO: Get from database
  return [
    { id: 'phone-1', type: 'phone', phone: '(555) 123-4567', createdAt: '2024-01-15', lastUsedAt: '2024-03-01' },
    { id: 'totp-1', type: 'totp', name: 'Google Authenticator', createdAt: '2024-01-20', lastUsedAt: '2024-03-10' },
  ];
}

async function hasBackupCodes(userId: string): Promise<{ hasBackupCodes: boolean; usedCount: number; totalCount: number }> {
  // TODO: Check backup codes
  return { hasBackupCodes: true, usedCount: 2, totalCount: 10 };
}

async function hasPersonalKey(userId: string): Promise<boolean> {
  // TODO: Check personal key
  return true;
}

/**
 * Get MFA settings data
 */
export async function getMfaSettingsData(): Promise<{
  configurations: MfaConfiguration[];
  backupCodes: { hasBackupCodes: boolean; usedCount: number; totalCount: number };
  hasPersonalKey: boolean;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId || !session.mfaVerified) {
    redirect('/sign-in');
  }

  const [configurations, backupCodes, personalKey] = await Promise.all([
    getUserMfaConfigurations(session.userId),
    hasBackupCodes(session.userId),
    hasPersonalKey(session.userId),
  ]);

  return {
    configurations,
    backupCodes,
    hasPersonalKey: personalKey,
  };
}
