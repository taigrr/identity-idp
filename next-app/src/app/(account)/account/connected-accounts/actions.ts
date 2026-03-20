/**
 * Connected Accounts Server Actions
 * Mirrors: app/presenters/account_show_presenter.rb connected_accounts
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';

export interface ConnectedAccount {
  id: string;
  issuer: string;
  friendlyName: string;
  description?: string;
  logoUrl?: string;
  connectedAt: Date;
  lastUsedAt?: Date;
  sharedEmail?: string;
  identityVerified: boolean;
}

export interface ConnectedAccountsResult {
  success: boolean;
  accounts?: ConnectedAccount[];
  error?: string;
}

export interface RevokeResult {
  success: boolean;
  error?: string;
}

export async function getConnectedAccounts(): Promise<ConnectedAccountsResult> {
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

  // TODO: Fetch connected accounts from database
  // const identities = await db.query.identities.findMany({
  //   where: eq(identities.userId, session.userId),
  //   with: {
  //     serviceProvider: true,
  //   },
  // });

  // For now, return mock data
  const mockAccounts: ConnectedAccount[] = [
    {
      id: '1',
      issuer: 'urn:gov:gsa:openidconnect.profiles:sp:sso:usajobs',
      friendlyName: 'USAJOBS',
      description: 'Find federal jobs and employment opportunities',
      logoUrl: undefined,
      connectedAt: new Date('2024-01-15'),
      lastUsedAt: new Date('2024-03-01'),
      sharedEmail: 'user@example.gov',
      identityVerified: true,
    },
    {
      id: '2',
      issuer: 'urn:gov:gsa:openidconnect.profiles:sp:sso:tsa',
      friendlyName: 'TSA PreCheck',
      description: 'TSA PreCheck application program',
      logoUrl: undefined,
      connectedAt: new Date('2023-11-20'),
      lastUsedAt: new Date('2024-02-15'),
      sharedEmail: 'user@example.gov',
      identityVerified: true,
    },
  ];

  return {
    success: true,
    accounts: mockAccounts,
  };
}

export async function getConnectedAccount(id: string): Promise<{
  success: boolean;
  account?: ConnectedAccount;
  error?: string;
}> {
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

  // TODO: Fetch specific account from database
  // const identity = await db.query.identities.findFirst({
  //   where: and(
  //     eq(identities.id, id),
  //     eq(identities.userId, session.userId)
  //   ),
  //   with: {
  //     serviceProvider: true,
  //   },
  // });

  // Mock data
  const mockAccount: ConnectedAccount = {
    id,
    issuer: 'urn:gov:gsa:openidconnect.profiles:sp:sso:usajobs',
    friendlyName: 'USAJOBS',
    description: 'Find federal jobs and employment opportunities',
    connectedAt: new Date('2024-01-15'),
    lastUsedAt: new Date('2024-03-01'),
    sharedEmail: 'user@example.gov',
    identityVerified: true,
  };

  return {
    success: true,
    account: mockAccount,
  };
}

export async function revokeConnectedAccount(id: string): Promise<RevokeResult> {
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

  // TODO: Delete the identity from database
  // const identity = await db.query.identities.findFirst({
  //   where: and(
  //     eq(identities.id, id),
  //     eq(identities.userId, session.userId)
  //   ),
  // });
  //
  // if (!identity) {
  //   return { success: false, error: 'Connected account not found' };
  // }
  //
  // await db.delete(identities).where(eq(identities.id, id));

  console.log(`[DEV] Revoked connected account ${id} for user ${session.userId}`);

  // TODO: Send email notification
  // await sendEmail({
  //   to: session.email,
  //   template: 'account_disconnected_from_sp',
  //   data: { spName: serviceProvider.friendlyName },
  // });

  return { success: true };
}
