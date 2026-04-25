/**
 * Account Reset Pending Page Actions
 * Mirrors: app/controllers/account_reset/pending_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import {
  getPendingRequestForUser,
  cancelAccountResetRequest,
  findByRequestToken,
} from '@/lib/db/account-reset';
import { getSession } from '@/lib/auth/session-manager';
import { config } from '@/lib/config';

const SESSION_COOKIE_NAME = 'session_id';

interface PendingResetData {
  requestedAt: string;
  grantedAt: string | null;
  fraudWaitPeriodDays: number;
  isGranted: boolean;
  timeRemaining: string;
  cancelToken: string | null;
}

interface PendingResetResult {
  success: boolean;
  data?: PendingResetData;
  error?: string;
}

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

function formatTimeRemaining(msRemaining: number): string {
  if (msRemaining <= 0) {
    return '';
  }

  const totalMinutes = Math.floor(msRemaining / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);

  return parts.join(' and ') || 'less than a minute';
}

export async function getPendingAccountReset(): Promise<PendingResetResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Session expired' };
  }

  // Get pending account reset request
  const request = await getPendingRequestForUser(session.userId);

  if (!request) {
    return {
      success: false,
      error: 'No pending account reset request found',
    };
  }

  // Calculate wait period
  const fraudWaitPeriodDays = config.accountResetWaitPeriodDays ?? 1;
  const waitPeriodMs = fraudWaitPeriodDays * 24 * 60 * 60 * 1000;

  const requestedAt = request.requestedAt || request.createdAt;
  const grantTime = new Date(requestedAt.getTime() + waitPeriodMs);
  const now = new Date();
  const msRemaining = grantTime.getTime() - now.getTime();

  const isGranted = msRemaining <= 0 && request.grantedAt !== null;
  const timeRemaining = formatTimeRemaining(msRemaining);

  return {
    success: true,
    data: {
      requestedAt: requestedAt.toISOString(),
      grantedAt: request.grantedAt?.toISOString() || null,
      fraudWaitPeriodDays,
      isGranted,
      timeRemaining,
      cancelToken: request.requestToken,
    },
  };
}

export async function cancelPendingReset(): Promise<{
  success: boolean;
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

  // Get pending request
  const request = await getPendingRequestForUser(session.userId);

  if (!request || !request.requestToken) {
    return {
      success: false,
      error: 'No pending account reset request found',
    };
  }

  // Cancel the request
  const result = await cancelAccountResetRequest(request.requestToken);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

export async function checkResetStatus(token: string): Promise<{
  success: boolean;
  isGranted?: boolean;
  grantedToken?: string;
  error?: string;
}> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  const request = await findByRequestToken(token);

  if (!request) {
    return { success: false, error: 'Invalid or expired token' };
  }

  if (request.cancelledAt) {
    return { success: false, error: 'Request was cancelled' };
  }

  if (request.grantedAt && request.grantedToken) {
    return {
      success: true,
      isGranted: true,
      grantedToken: request.grantedToken,
    };
  }

  return {
    success: true,
    isGranted: false,
  };
}
