/**
 * Signup actions - Server Actions for user registration
 * Mirrors: app/controllers/sign_up/registrations_controller.rb
 */

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { emailAddresses } from '@/db/schema/email-addresses';
import { fingerprintEmail } from '@/lib/auth/user-service';
import { createPiiEncryptor } from '@/lib/encryption';
import { getSessionManager, generateSessionId, type SessionData } from '@/lib/auth/session-manager';
import { getConfig } from '@/lib/config';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms of use',
  }),
  emailLanguage: z.string().optional(),
});

export interface SignupState {
  error?: string;
  fieldErrors?: {
    email?: string[];
    termsAccepted?: string[];
  };
}

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const cookieStore = await cookies();
  const sessionManager = getSessionManager();

  // Validate input
  const validation = signupSchema.safeParse({
    email: formData.get('email'),
    termsAccepted: formData.get('termsAccepted') === 'on',
    emailLanguage: formData.get('emailLanguage') ?? 'en',
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, emailLanguage } = validation.data;
  const normalizedEmail = email.toLowerCase().trim();
  const fingerprint = fingerprintEmail(normalizedEmail);

  // Check if email already exists
  const existingEmail = await db
    .select()
    .from(emailAddresses)
    .where(eq(emailAddresses.emailFingerprint, fingerprint))
    .limit(1);

  if (existingEmail.length > 0) {
    // Email exists - we still "succeed" but send a different email
    // This prevents email enumeration attacks
    // In production, this would trigger a "someone tried to sign up with your email" notification

    // Store email in session and redirect to verification page
    const sessionId = generateSessionId();
    const session: SessionData = {
      signInFlow: 'sign_up',
      flash: {
        flashes: {
          email: normalizedEmail,
        },
      },
    };

    await sessionManager.create(sessionId, session);

    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    redirect('/signup/verify-email');
  }

  // Create new user
  const config = getConfig();
  const userUuid = randomUUID();
  const piiEncryptor = createPiiEncryptor(config.passwordPepper);

  // Encrypt email for storage
  const encryptedEmail = await piiEncryptor.encrypt(normalizedEmail, userUuid);

  try {
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        uuid: userUuid,
        emailLanguage: emailLanguage ?? 'en',
        acceptedTermsAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Generate confirmation token
    const confirmationToken = randomUUID();

    // Create email address record
    await db.insert(emailAddresses).values({
      userId: newUser.id,
      encryptedEmail,
      emailFingerprint: fingerprint,
      confirmationToken,
      confirmationSentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send confirmation email
    // await sendConfirmationEmail(normalizedEmail, confirmationToken);

    // Create session
    const sessionId = generateSessionId();
    const session: SessionData = {
      signInFlow: 'sign_up',
      flash: {
        flashes: {
          email: normalizedEmail,
        },
      },
    };

    await sessionManager.create(sessionId, session);

    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    redirect('/signup/verify-email');
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      error: 'An error occurred while creating your account. Please try again.',
    };
  }
}
