'use server';

/**
 * Account Deletion Server Actions
 * Mirrors: app/controllers/users/delete_controller.rb
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export interface DeleteAccountState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    password?: string;
  };
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return null;
  return null;
}

export async function deleteAccount(
  prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }

  const validatedFields = DeleteAccountSchema.safeParse({
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: {
        password: validatedFields.error.flatten().fieldErrors.password?.[0],
      },
    };
  }

  const { password } = validatedFields.data;

  // TODO: Verify password
  // const user = await db.query.users.findFirst({
  //   where: eq(users.uuid, userId),
  // });
  // const isValid = await verifyPassword(password, user.encryptedPassword);
  // if (!isValid) {
  //   return {
  //     success: false,
  //     fieldErrors: { password: 'Password is incorrect' },
  //   };
  // }

  // TODO: Send push notifications to SPs
  // TODO: Send account deletion email
  // TODO: Send SMS if phone configured
  // TODO: Delete all user data (profiles, identities, sessions, etc.)
  // TODO: Delete user

  console.log('Deleting account for user:', userId, 'with password verification');

  // Clear session
  const cookieStore = await cookies();
  cookieStore.delete('session_id');

  redirect('/account-deleted');
}
