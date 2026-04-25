'use server';

/**
 * Hybrid Mobile Entry Actions
 * Mirrors: app/controllers/idv/hybrid_mobile/entry_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface DocumentCaptureSession {
  uuid: string;
  userId?: string;
  status: 'pending' | 'in_progress' | 'complete' | 'expired';
  createdAt: string;
  expiresAt: string;
}

// TODO: Replace with actual implementations
async function getDocumentCaptureSession(uuid: string): Promise<DocumentCaptureSession | null> {
  // TODO: Look up from database
  console.log('Getting document capture session:', uuid);
  return {
    uuid,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

async function createMobileSession(sessionId: string, captureSession: DocumentCaptureSession): Promise<void> {
  // TODO: Set up mobile session
  console.log('Creating mobile session:', { sessionId, captureSession });
}

/**
 * Validate and initialize hybrid mobile session
 */
export async function initializeHybridSession(
  uuid: string,
): Promise<{
  valid: boolean;
  error?: string;
  nextStep?: string;
}> {
  if (!uuid || uuid.length < 20) {
    return { valid: false, error: 'Invalid session link' };
  }

  const captureSession = await getDocumentCaptureSession(uuid);

  if (!captureSession) {
    return { valid: false, error: 'Session not found. Please request a new link.' };
  }

  if (captureSession.status === 'expired' || new Date(captureSession.expiresAt) < new Date()) {
    return { valid: false, error: 'This link has expired. Please request a new link.' };
  }

  if (captureSession.status === 'complete') {
    return { valid: false, error: 'Document capture already completed.' };
  }

  // Create mobile session
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value || crypto.randomUUID();

  await createMobileSession(sessionId, captureSession);

  // Set session cookie if not present
  if (!cookieStore.get(SESSION_COOKIE_NAME)?.value) {
    // Note: Cookie setting happens via response in actual implementation
  }

  return { valid: true, nextStep: `/idv/hybrid-mobile/document-capture?session=${uuid}` };
}
