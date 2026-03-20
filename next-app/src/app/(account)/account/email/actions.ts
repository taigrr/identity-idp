'use server';

/**
 * Email Management Server Actions
 * Mirrors: app/controllers/users/emails_controller.rb
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const AddEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const DeleteEmailSchema = z.object({
  emailId: z.string().min(1, 'Email ID is required'),
});

export interface EmailActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    email?: string;
  };
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return null;

  // TODO: Replace with actual session lookup
  return null;
}

export async function addEmail(
  prevState: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }

  const validatedFields = AddEmailSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: {
        email: validatedFields.error.flatten().fieldErrors.email?.[0],
      },
    };
  }

  const { email } = validatedFields.data;

  // TODO: Check if email already exists for any user
  // const existingEmail = await db.query.emailAddresses.findFirst({
  //   where: eq(emailAddresses.email, email),
  // });
  // if (existingEmail) {
  //   return { success: false, error: 'This email is already in use' };
  // }

  // TODO: Check max emails per user
  // const userEmails = await db.query.emailAddresses.findMany({
  //   where: eq(emailAddresses.userId, userId),
  // });
  // if (userEmails.length >= 10) {
  //   return { success: false, error: 'Maximum email addresses reached' };
  // }

  // TODO: Create unconfirmed email and send confirmation
  // await db.insert(emailAddresses).values({
  //   userId,
  //   email,
  //   confirmed: false,
  //   confirmationToken: generateToken(),
  //   confirmationSentAt: new Date(),
  // });

  // TODO: Send confirmation email
  // await sendConfirmationEmail(email, confirmationToken);

  console.log('Adding email:', email, 'for user:', userId);

  redirect('/account/email/verify?email=' + encodeURIComponent(email));
}

export async function resendEmailConfirmation(
  prevState: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }

  const email = formData.get('email') as string;

  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  // TODO: Find unconfirmed email and resend
  // const emailRecord = await db.query.emailAddresses.findFirst({
  //   where: and(
  //     eq(emailAddresses.userId, userId),
  //     eq(emailAddresses.email, email),
  //     eq(emailAddresses.confirmed, false),
  //   ),
  // });

  // TODO: Rate limit resend attempts

  // TODO: Send confirmation email
  console.log('Resending confirmation to:', email);

  return { success: true };
}

export async function deleteEmail(
  prevState: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }

  const validatedFields = DeleteEmailSchema.safeParse({
    emailId: formData.get('emailId'),
  });

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid email ID' };
  }

  const { emailId } = validatedFields.data;

  // TODO: Verify email belongs to user and is not the last one
  // const userEmails = await db.query.emailAddresses.findMany({
  //   where: eq(emailAddresses.userId, userId),
  // });

  // TODO: Cannot delete last email
  // if (userEmails.length <= 1) {
  //   return { success: false, error: 'Cannot delete your only email address' };
  // }

  // TODO: Delete the email
  // await db.delete(emailAddresses).where(
  //   and(eq(emailAddresses.id, emailId), eq(emailAddresses.userId, userId)),
  // );

  console.log('Deleting email:', emailId);

  redirect('/account');
}
