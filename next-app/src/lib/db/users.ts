/**
 * User Service
 * Mirrors: app/models/user.rb (core user operations)
 *
 * Handles user CRUD and related operations.
 */

import { eq, and, sql } from 'drizzle-orm';
import { db, users, emailAddresses, type User } from '@/db';
import { randomUUID, createHash } from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/password-verifier';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Creates a new user.
 */
export async function createUser(
  email: string,
  password: string
): Promise<{ user: User; emailAddress: typeof emailAddresses.$inferSelect }> {
  const now = new Date();
  const uuid = randomUUID();

  // Hash password
  const passwordDigest = await hashPassword(password);
  const encryptedPasswordDigest = await encrypt(passwordDigest);

  // Create email fingerprint
  const emailFingerprint = createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
  const encryptedEmail = await encrypt(email);

  return db.transaction(async (tx) => {
    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        uuid,
        encryptedPasswordDigest,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create primary email address
    const [emailAddr] = await tx
      .insert(emailAddresses)
      .values({
        userId: user.id,
        encryptedEmail,
        emailFingerprint,
        confirmationToken: randomUUID(),
        confirmationSentAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return { user, emailAddress: emailAddr };
  });
}

/**
 * Finds a user by ID.
 */
export async function findUserById(id: number): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user ?? null;
}

/**
 * Finds a user by UUID.
 */
export async function findUserByUuid(uuid: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.uuid, uuid),
  });
  return user ?? null;
}

/**
 * Finds a user by email address.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const fingerprint = createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');

  const emailAddr = await db.query.emailAddresses.findFirst({
    where: and(
      eq(emailAddresses.emailFingerprint, fingerprint),
      sql`${emailAddresses.confirmedAt} IS NOT NULL`
    ),
    with: {
      user: true,
    },
  });

  if (!emailAddr) return null;

  return findUserById(emailAddr.userId as number);
}

/**
 * Finds a user by reset password token.
 */
export async function findUserByResetToken(
  token: string
): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.resetPasswordToken, token),
  });
  return user ?? null;
}

/**
 * Authenticates a user with email and password.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);

  if (!user || !user.encryptedPasswordDigest) {
    return null;
  }

  // Decrypt and verify password
  const passwordDigest = await decrypt(user.encryptedPasswordDigest);
  const isValid = await verifyPassword(password, passwordDigest);

  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Updates user's password.
 */
export async function updatePassword(
  userId: number,
  newPassword: string
): Promise<boolean> {
  const passwordDigest = await hashPassword(newPassword);
  const encryptedPasswordDigest = await encrypt(passwordDigest);

  const result = await db
    .update(users)
    .set({
      encryptedPasswordDigest,
      resetPasswordToken: null,
      resetPasswordSentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Sets a password reset token for a user.
 */
export async function setResetPasswordToken(
  userId: number
): Promise<string | null> {
  const token = randomUUID();
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      resetPasswordToken: token,
      resetPasswordSentAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0 ? token : null;
}

/**
 * Confirms a user account.
 */
export async function confirmUser(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      confirmedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Marks user's accepted terms.
 */
export async function acceptTerms(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      acceptedTermsAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Suspends a user.
 */
export async function suspendUser(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      suspendedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Reinstates a suspended user.
 */
export async function reinstateUser(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      reinstatedAt: now,
      suspendedAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Checks if a user is suspended.
 */
export async function isUserSuspended(userId: number): Promise<boolean> {
  const user = await findUserById(userId);
  return user?.suspendedAt !== null && user?.reinstatedAt === null;
}

/**
 * Updates second factor locked timestamp.
 */
export async function lockSecondFactor(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .update(users)
    .set({
      secondFactorLockedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Unlocks second factor.
 */
export async function unlockSecondFactor(userId: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({
      secondFactorLockedAt: null,
      secondFactorAttemptsCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Increments second factor attempts count.
 */
export async function incrementSecondFactorAttempts(
  userId: number
): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({
      secondFactorAttemptsCount: sql`${users.secondFactorAttemptsCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ count: users.secondFactorAttemptsCount });

  return updated?.count ?? 0;
}

/**
 * Resets second factor attempts count.
 */
export async function resetSecondFactorAttempts(
  userId: number
): Promise<boolean> {
  const result = await db
    .update(users)
    .set({
      secondFactorAttemptsCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Sets user's email language preference.
 */
export async function setEmailLanguage(
  userId: number,
  language: string
): Promise<boolean> {
  const result = await db
    .update(users)
    .set({
      emailLanguage: language,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result.length > 0;
}

/**
 * Gets user's email language preference.
 */
export async function getEmailLanguage(
  userId: number
): Promise<string | null> {
  const user = await findUserById(userId);
  return user?.emailLanguage ?? null;
}
