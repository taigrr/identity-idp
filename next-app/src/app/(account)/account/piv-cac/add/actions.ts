'use server';

/**
 * PIV/CAC Setup Actions
 * Mirrors: app/controllers/users/piv_cac_authentication_setup_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';
const MAX_PIV_CAC_PER_ACCOUNT = 5;

interface SessionData {
  userId?: string;
  mfaVerified?: boolean;
  pivCacNonce?: string;
  pivCacNickname?: string;
  addPivCacAfter2fa?: boolean;
  inAccountCreationFlow?: boolean;
}

interface PivCacConfig {
  id: string;
  name: string;
  x509DnUuid: string;
  createdAt: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123', mfaVerified: true };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserPivCacConfigs(userId: string): Promise<PivCacConfig[]> {
  // TODO: Get from database
  return [];
}

async function checkPivCacNameExists(userId: string, name: string): Promise<boolean> {
  // TODO: Check database
  return false;
}

async function processPivCacToken(
  userId: string,
  token: string,
  nonce: string,
  name: string,
): Promise<{ success: boolean; error?: string; x509Dn?: string; x509Issuer?: string }> {
  // TODO: Process PIV/CAC token
  console.log('Processing PIV/CAC token:', { userId, token: token.slice(0, 10) + '...', nonce, name });
  return { success: false, error: 'PIV/CAC setup not implemented' };
}

async function savePivCacConfiguration(
  userId: string,
  name: string,
  x509Dn: string,
  x509Issuer: string,
): Promise<void> {
  // TODO: Save to database
  console.log('Saving PIV/CAC config:', { userId, name, x509Dn, x509Issuer });
}

async function sendMfaAddedEmail(userId: string, eventType: string): Promise<void> {
  // TODO: Send email
  console.log('Sending MFA added email:', { userId, eventType });
}

function generateNonce(): string {
  return crypto.randomUUID();
}

function getPivCacServiceUrl(nonce: string, redirectUri: string): string {
  // TODO: Replace with actual PIV/CAC service URL
  return `https://piv-cac-service.example.gov/authenticate?nonce=${nonce}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Check if user can add PIV/CAC
 */
export async function getPivCacSetupData(): Promise<{
  canAdd: boolean;
  currentCount: number;
  maxCount: number;
  pivCacRequired: boolean;
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

  const configs = await getUserPivCacConfigs(session.userId);

  return {
    canAdd: configs.length < MAX_PIV_CAC_PER_ACCOUNT,
    currentCount: configs.length,
    maxCount: MAX_PIV_CAC_PER_ACCOUNT,
    pivCacRequired: false, // TODO: Check SP requirements
  };
}

/**
 * Submit PIV/CAC nickname and redirect to PIV/CAC service
 */
export async function submitPivCacSetup(
  formData: FormData,
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { error: 'Not authenticated' };
  }

  const skip = formData.get('skip') === 'true';
  if (skip) {
    await updateSession(sessionId, { addPivCacAfter2fa: false });
    redirect('/account');
  }

  const name = formData.get('name')?.toString()?.trim();
  if (!name) {
    return { error: 'Please enter a name for this PIV/CAC' };
  }

  // Check for duplicate name
  const nameExists = await checkPivCacNameExists(session.userId, name);
  if (nameExists) {
    return { error: 'You already have a PIV/CAC with this name. Please choose a different name.' };
  }

  // Store nickname and create nonce
  const nonce = generateNonce();
  await updateSession(sessionId, {
    pivCacNickname: name,
    pivCacNonce: nonce,
  });

  // Redirect to PIV/CAC service
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/piv-cac/add`;
  const serviceUrl = getPivCacServiceUrl(nonce, redirectUri);

  redirect(serviceUrl);
}

/**
 * Process PIV/CAC token callback
 */
export async function processPivCacCallback(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!session.pivCacNonce || !session.pivCacNickname) {
    return { success: false, error: 'Invalid request' };
  }

  const result = await processPivCacToken(
    session.userId,
    token,
    session.pivCacNonce,
    session.pivCacNickname,
  );

  if (result.success && result.x509Dn && result.x509Issuer) {
    // Save configuration
    await savePivCacConfiguration(
      session.userId,
      session.pivCacNickname,
      result.x509Dn,
      result.x509Issuer,
    );

    // Send notification
    await sendMfaAddedEmail(session.userId, 'piv_cac_enabled');

    // Clear session data
    await updateSession(sessionId, {
      pivCacNonce: undefined,
      pivCacNickname: undefined,
      addPivCacAfter2fa: false,
    });

    redirect('/account');
  }

  return { success: false, error: result.error || 'PIV/CAC setup failed' };
}
