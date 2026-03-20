'use server';

/**
 * Password Management Server Actions
 * Mirrors: app/controllers/users/passwords_controller.rb
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 12;

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    passwordConfirmation: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });

export interface PasswordActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  };
  personalKeyRegenerated?: boolean;
  newPersonalKey?: string;
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return null;

  // TODO: Replace with actual session lookup
  return null;
}

export async function changePassword(
  prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }

  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten();
    return {
      success: false,
      fieldErrors: {
        currentPassword: errors.fieldErrors.currentPassword?.[0],
        password: errors.fieldErrors.password?.[0],
        passwordConfirmation: errors.fieldErrors.passwordConfirmation?.[0],
      },
    };
  }

  const { currentPassword, password } = validatedFields.data;

  // TODO: Verify current password
  // const user = await db.query.users.findFirst({
  //   where: eq(users.uuid, userId),
  // });
  // const isValid = await verifyPassword(currentPassword, user.encryptedPassword);
  // if (!isValid) {
  //   return {
  //     success: false,
  //     fieldErrors: { currentPassword: 'Current password is incorrect' },
  //   };
  // }

  // TODO: Check password not reused, not breached
  // const breached = await checkBreachedPassword(password);
  // if (breached) {
  //   return {
  //     success: false,
  //     fieldErrors: { password: 'This password has been exposed in a data breach' },
  //   };
  // }

  // TODO: Hash new password and update
  // const hashedPassword = await hashPassword(password);
  // await db.update(users).set({
  //   encryptedPassword: hashedPassword,
  //   updatedAt: new Date(),
  // }).where(eq(users.uuid, userId));

  // TODO: Regenerate personal key if user has verified identity
  // const hasProfile = await db.query.profiles.findFirst({
  //   where: eq(profiles.userId, userId),
  // });
  // let newPersonalKey: string | undefined;
  // if (hasProfile) {
  //   newPersonalKey = generatePersonalKey();
  //   // Re-encrypt profile with new password
  // }

  // TODO: Send password change notification email

  console.log('Changing password for user:', userId);

  // If personal key was regenerated, show it to user
  // return {
  //   success: true,
  //   personalKeyRegenerated: !!newPersonalKey,
  //   newPersonalKey,
  // };

  redirect('/account?password_changed=true');
}
