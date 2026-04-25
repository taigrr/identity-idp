'use server';

/**
 * Events (Device History) Actions
 * Mirrors: app/controllers/events_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';
const EVENTS_PER_PAGE = 25;

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
}

interface DeviceEvent {
  id: string;
  eventType: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  occurredAt: string;
  disavowToken?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function getUserEvents(userId: string, page: number): Promise<{
  events: DeviceEvent[];
  totalPages: number;
  currentPage: number;
}> {
  // TODO: Get from database
  const events: DeviceEvent[] = [
    {
      id: '1',
      eventType: 'sign_in_after_2fa',
      deviceName: 'Chrome on macOS',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      occurredAt: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      eventType: 'phone_added',
      deviceName: 'Safari on iPhone',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0...',
      occurredAt: '2024-03-14T15:45:00Z',
    },
  ];

  return {
    events,
    totalPages: 1,
    currentPage: page,
  };
}

/**
 * Get user device events
 */
export async function getEventsData(page: number = 1): Promise<{
  events: DeviceEvent[];
  totalPages: number;
  currentPage: number;
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

  return getUserEvents(session.userId, page);
}
