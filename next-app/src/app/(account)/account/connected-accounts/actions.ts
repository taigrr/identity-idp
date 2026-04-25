/**
 * Connected Accounts Actions
 * Mirrors: app/controllers/users/service_provider_revoke_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { db, identities } from '@/db';
import { getSession } from '@/lib/auth/session-manager';
import { decrypt } from '@/lib/encryption';

const SESSION_COOKIE_NAME = 'session_id';

export interface ConnectedAccount {
  id: string;
  issuer: string;
  friendlyName: string;
  description?: string;
  connectedAt: string;
  lastAuthenticatedAt: string | null;
  lastUsedAt?: string;
  sharedEmail?: string;
  sharedAttributes: string[];
  logoUrl?: string;
  identityVerified?: boolean;
}

interface GetAccountResult {
  success: boolean;
  account?: ConnectedAccount;
  error?: string;
}

interface GetAccountsResult {
  success: boolean;
  accounts?: ConnectedAccount[];
  error?: string;
}

interface RevokeResult {
  success: boolean;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getConnectedAccounts(): Promise<GetAccountsResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    const userIdentities = await db.query.identities.findMany({
      where: eq(identities.userId, session.userId),
    });

    const accounts: ConnectedAccount[] = userIdentities.map((identity) => ({
      id: identity.id.toString(),
      issuer: identity.serviceProvider || '',
      friendlyName: identity.serviceProvider || 'Unknown Service',
      description: undefined,
      connectedAt: identity.createdAt?.toISOString() || '',
      lastAuthenticatedAt: identity.lastAuthenticatedAt?.toISOString() || null,
      sharedAttributes: [],
    }));

    return { success: true, accounts };
  } catch (error) {
    console.error('Failed to get connected accounts:', error);
    return { success: false, error: 'Failed to load connected accounts' };
  }
}

export async function getConnectedAccount(
  accountId: string
): Promise<GetAccountResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    const identity = await db.query.identities.findFirst({
      where: and(
        eq(identities.id, parseInt(accountId, 10)),
        eq(identities.userId, session.userId)
      ),
    });

    if (!identity) {
      return { success: false, error: 'Connected account not found' };
    }

    const account: ConnectedAccount = {
      id: identity.id.toString(),
      issuer: identity.serviceProvider || '',
      friendlyName: identity.serviceProvider || 'Unknown Service',
      description: undefined,
      connectedAt: identity.createdAt?.toISOString() || '',
      lastAuthenticatedAt: identity.lastAuthenticatedAt?.toISOString() || null,
      sharedAttributes: [],
    };

    return { success: true, account };
  } catch (error) {
    console.error('Failed to get connected account:', error);
    return { success: false, error: 'Failed to load account details' };
  }
}

export async function revokeConnectedAccount(
  accountId: string
): Promise<RevokeResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  try {
    const result = await db
      .delete(identities)
      .where(
        and(
          eq(identities.id, parseInt(accountId, 10)),
          eq(identities.userId, session.userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Connected account not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke connected account:', error);
    return { success: false, error: 'Failed to disconnect account' };
  }
}
