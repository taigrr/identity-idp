/**
 * Account History Server Actions
 * Mirrors: app/presenters/account_show_presenter.rb recent_events
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';

export interface AccountEvent {
  id: string;
  eventType: string;
  occurredAt: Date;
  ipAddress?: string;
  details?: string;
}

export interface AccountHistoryResult {
  success: boolean;
  events?: AccountEvent[];
  error?: string;
}

export async function getAccountHistory(): Promise<AccountHistoryResult> {
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

  // TODO: Fetch events from database
  // const events = await db.query.events.findMany({
  //   where: eq(events.userId, session.userId),
  //   orderBy: [desc(events.createdAt)],
  //   limit: 100,
  // });

  // For now, return mock data
  const mockEvents: AccountEvent[] = [
    {
      id: '1',
      eventType: 'sign_in',
      occurredAt: new Date('2024-03-15T14:30:00Z'),
      ipAddress: '192.168.1.100',
      details: 'Chrome on macOS',
    },
    {
      id: '2',
      eventType: 'sp_connected',
      occurredAt: new Date('2024-03-14T10:15:00Z'),
      ipAddress: '192.168.1.100',
      details: 'USAJOBS',
    },
    {
      id: '3',
      eventType: 'identity_verified',
      occurredAt: new Date('2024-03-10T09:00:00Z'),
      ipAddress: '192.168.1.100',
    },
    {
      id: '4',
      eventType: 'phone_added',
      occurredAt: new Date('2024-03-01T16:45:00Z'),
      ipAddress: '192.168.1.100',
      details: '***-***-5678',
    },
    {
      id: '5',
      eventType: 'totp_enabled',
      occurredAt: new Date('2024-02-28T11:20:00Z'),
      ipAddress: '192.168.1.100',
      details: 'My authentication app',
    },
    {
      id: '6',
      eventType: 'backup_codes_created',
      occurredAt: new Date('2024-02-28T11:15:00Z'),
      ipAddress: '192.168.1.100',
    },
    {
      id: '7',
      eventType: 'email_added',
      occurredAt: new Date('2024-02-25T08:30:00Z'),
      ipAddress: '192.168.1.100',
      details: 'user@work.gov',
    },
    {
      id: '8',
      eventType: 'password_changed',
      occurredAt: new Date('2024-02-20T15:00:00Z'),
      ipAddress: '192.168.1.100',
    },
    {
      id: '9',
      eventType: 'account_created',
      occurredAt: new Date('2024-01-15T10:00:00Z'),
      ipAddress: '192.168.1.100',
    },
  ];

  return {
    success: true,
    events: mockEvents,
  };
}
