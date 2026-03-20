/**
 * TOTP verification actions
 */

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSessionManager, type SessionData } from '@/lib/auth/session-manager';
import { verifyTotpCode } from '@/lib/mfa/totp';

const totpSchema = z.object({
  code: z.string().min(6).max(6),
});

export interface TotpVerifyState {
  error?: string;
}

export async function verifyTotp(
  _prevState: TotpVerifyState,
  formData: FormData
): Promise<TotpVerifyState> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    redirect('/login');
  }

  const session = await sessionManager.get(sessionId);
  if (!session?.userId) {
    redirect('/login');
  }

  const validation = totpSchema.safeParse({
    code: formData.get('code'),
  });

  if (!validation.success) {
    return { error: 'Please enter a valid 6-digit code' };
  }

  const { code } = validation.data;

  // TODO: Fetch user's TOTP configurations from database
  // For now, use a test secret for demo purposes
  const testSecret = process.env.TEST_TOTP_SECRET;

  if (!testSecret) {
    // In production, would fetch from DB
    return { error: 'TOTP not configured for this account' };
  }

  const result = verifyTotpCode(testSecret, code);

  if (result === null) {
    return { error: 'Invalid code. Please try again.' };
  }

  // Mark MFA as verified in session
  await sessionManager.update(sessionId, {
    ...session,
    mfaVerified: true,
    mfaVerifiedAt: new Date().toISOString(),
    mfaMethod: 'totp',
  } as SessionData);

  // Redirect to account or original destination
  redirect('/account');
}
