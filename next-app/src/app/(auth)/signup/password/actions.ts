/**
 * Password Setup Actions
 * Mirrors: app/controllers/sign_up/passwords_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { getSessionManager } from '@/lib/auth/session-manager';

export interface PasswordSetupResult {
  success: boolean;
  error?: string;
}

export async function setupPassword(params: {
  token: string;
  password: string;
  passwordConfirmation: string;
}): Promise<PasswordSetupResult> {
  const { token, password, passwordConfirmation } = params;

  // Validate passwords match
  if (password !== passwordConfirmation) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Validate password strength
  if (password.length < 12) {
    return { success: false, error: 'Password must be at least 12 characters' };
  }

  // Check for common passwords
  const commonPasswords = ['password1234', '123456789012', 'qwertyuiopas'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { success: false, error: 'Please choose a stronger password' };
  }

  // TODO: Validate token and get user
  // const emailAddress = await db.query.emailAddresses.findFirst({
  //   where: eq(emailAddresses.confirmationToken, tokenDigest),
  //   with: { user: true },
  // });
  //
  // if (!emailAddress) {
  //   return { success: false, error: 'Invalid session' };
  // }

  // TODO: Hash and store password
  // const hashedPassword = await hashPassword(password);
  // await db.update(users).set({
  //   encryptedPassword: hashedPassword,
  // }).where(eq(users.id, emailAddress.userId));

  console.log(`[DEV] Password set for token: ${token}`);

  // Create session for new user
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  
  // Generate a session ID
  const sessionId = crypto.randomUUID();
  
  await sessionManager.create(sessionId, {
    userId: 1, // Mock user ID - would come from DB
    userUuid: crypto.randomUUID(),
    email: 'user@example.gov',
  });

  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return { success: true };
}
