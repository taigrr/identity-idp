'use server';

/**
 * PIV/CAC Verification Actions
 * Mirrors: app/controllers/two_factor_authentication/piv_cac_verification_controller.rb
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

interface SessionData {
  userId?: string;
  signInFlow?: string;
  pivCacNonce?: string;
  mfaVerified?: boolean;
  addPivCacAfter2fa?: boolean;
}

interface PivCacConfig {
  id: string;
  x509DnUuid: string;
  x509Issuer: string;
  name?: string;
  createdAt: string;
}

interface PivCacVerificationResult {
  success: boolean;
  error?: string;
  errorType?: 'certificate_invalid' | 'certificate_expired' | 'user_piv_cac_mismatch' | 'token_invalid';
  x509Dn?: string;
  x509Issuer?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return { userId: 'user-123' };
}

async function updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
  console.log('Updating session:', sessionId?.slice(0, 8) + '...', data);
}

async function getUserPivCacConfigs(userId: string): Promise<PivCacConfig[]> {
  // TODO: Replace with actual DB query
  return [];
}

async function verifyPivCacToken(
  userId: string,
  token: string,
  nonce: string,
): Promise<PivCacVerificationResult> {
  // TODO: Replace with actual PIV/CAC service verification
  console.log('Verifying PIV/CAC token for user:', userId);
  return { success: false, error: 'PIV/CAC verification not implemented', errorType: 'token_invalid' };
}

async function savePivCacInformation(
  userId: string,
  subject: string,
  issuer: string,
): Promise<void> {
  // TODO: Save PIV/CAC session information
  console.log('Saving PIV/CAC info:', { userId, subject, issuer });
}

async function recordMfaSuccess(
  sessionId: string,
  method: string,
): Promise<void> {
  await updateSession(sessionId, { mfaVerified: true });
}

function generateNonce(): string {
  return crypto.randomUUID();
}

function getPivCacServiceUrl(nonce: string, redirectUri: string): string {
  // TODO: Replace with actual PIV/CAC service URL
  return `https://piv-cac-service.example.gov/authenticate?nonce=${nonce}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Check if PIV/CAC is enabled for current user
 */
export async function checkPivCacEnabled(): Promise<{
  enabled: boolean;
  configs: PivCacConfig[];
  canAddMore: boolean;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    redirect('/sign-in');
  }

  const configs = await getUserPivCacConfigs(session.userId);
  const maxPivCac = 5; // IdentityConfig.store.max_piv_cac_per_account

  return {
    enabled: configs.length > 0,
    configs,
    canAddMore: configs.length < maxPivCac,
  };
}

/**
 * Redirect to PIV/CAC service
 */
export async function redirectToPivCacService(): Promise<never> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const nonce = generateNonce();
  await updateSession(sessionId, { pivCacNonce: nonce });

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/two-factor/piv-cac`;
  const serviceUrl = getPivCacServiceUrl(nonce, redirectUri);

  redirect(serviceUrl);
}

/**
 * Process PIV/CAC token callback
 */
export async function verifyPivCac(
  token: string,
): Promise<{ success: boolean; error?: string; errorType?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return { success: false, error: 'Session expired' };
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!session.pivCacNonce) {
    return { success: false, error: 'Invalid request - no nonce found' };
  }

  const result = await verifyPivCacToken(session.userId, token, session.pivCacNonce);

  if (result.success) {
    // Clear nonce
    await updateSession(sessionId, { pivCacNonce: undefined, signInFlow: 'sign_in' });

    // Save PIV/CAC information
    if (result.x509Dn && result.x509Issuer) {
      await savePivCacInformation(session.userId, result.x509Dn, result.x509Issuer);
    }

    // Record MFA success
    await recordMfaSuccess(sessionId, 'piv_cac');

    redirect('/account');
  }

  // Handle mismatch - check if user can add another PIV/CAC
  if (result.errorType === 'user_piv_cac_mismatch') {
    const { canAddMore } = await checkPivCacEnabled();
    if (canAddMore) {
      redirect('/two-factor/piv-cac/mismatch');
    }
  }

  return {
    success: false,
    error: result.error || 'PIV/CAC verification failed',
    errorType: result.errorType,
  };
}
