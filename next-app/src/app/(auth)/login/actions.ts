/**
 * Login actions - Server Actions for authentication
 * Mirrors: app/controllers/users/sessions_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserService } from '@/lib/auth/user-service';
import { getSessionManager, generateSessionId, type SessionData } from '@/lib/auth/session-manager';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export interface LoginState {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}

const MAX_SIGN_IN_FAILURES = 5;
const SIGN_IN_FAILURE_WINDOW_SECONDS = 300; // 5 minutes

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();
  const userService = getUserService();

  // Get existing session for failure tracking
  const existingSessionId = cookieStore.get('session_id')?.value;
  let session: SessionData | null = null;

  if (existingSessionId) {
    session = await sessionManager.get(existingSessionId);
  }

  // Check if rate limited from session failures
  if (session?.signInFailureCount && session.signInFailureCount >= MAX_SIGN_IN_FAILURES) {
    const failedAt = session.maxSignInFailuresAt;
    if (failedAt && Date.now() / 1000 - failedAt < SIGN_IN_FAILURE_WINDOW_SECONDS) {
      const remaining = Math.ceil(
        SIGN_IN_FAILURE_WINDOW_SECONDS - (Date.now() / 1000 - failedAt)
      );
      return {
        error: `Too many failed attempts. Please try again in ${remaining} seconds.`,
      };
    }
    // Window expired, reset counters
    if (session) {
      session.signInFailureCount = 0;
      session.maxSignInFailuresAt = undefined;
    }
  }

  // Validate input
  const validation = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  // Authenticate user
  const user = await userService.authenticate(email, password);

  if (!user) {
    // Track failure in session
    const sessionId = existingSessionId ?? generateSessionId();
    const failureCount = (session?.signInFailureCount ?? 0) + 1;
    const updatedSession: SessionData = {
      ...session,
      signInFailureCount: failureCount,
    };

    if (failureCount >= MAX_SIGN_IN_FAILURES) {
      updatedSession.maxSignInFailuresAt = Math.floor(Date.now() / 1000);
    }

    await sessionManager.create(sessionId, updatedSession);

    if (!existingSessionId) {
      cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    return {
      error: 'Invalid email or password',
    };
  }

  // Check if user is locked out
  if (userService.isLockedOut(user)) {
    return {
      error: 'Your account is temporarily locked. Please try again later.',
    };
  }

  // Check if user is suspended
  if (userService.isSuspended(user)) {
    return {
      error: 'Your account has been suspended. Please contact support.',
    };
  }

  // Create authenticated session
  const sessionId = generateSessionId();
  const newSession: SessionData = {
    userId: String(user.id),
    userUuid: user.uuid,
    signInFlow: 'sign_in',
    signInFailureCount: 0,
    mfaVerified: false,
  };

  await sessionManager.create(sessionId, newSession);

  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Update last sign-in timestamp
  await userService.updateLastSignIn(user.id, email);

  // Check if user needs to accept terms
  if (!userService.hasAcceptedTerms(user)) {
    redirect('/rules-of-use');
  }

  // Redirect to 2FA
  redirect('/two-factor');
}
